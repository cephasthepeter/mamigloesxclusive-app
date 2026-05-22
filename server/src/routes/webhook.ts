import express from 'express';
import { Webhook, WebhookVerificationError } from 'svix';
import User from '../models/User.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/clerk
 * @desc    Sync Clerk user data to app database
 * @access  Public (webhook signature verified)
 * @body    Clerk webhook payload
 */
router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('🔴 CLERK_WEBHOOK_SECRET not configured in environment variables');
    return res.status(500).json({ 
      error: 'Webhook configuration error',
      message: 'CLERK_WEBHOOK_SECRET is not set'
    });
  }

  try {
    const payload = req.body;
    const headers = req.headers;

    const svixId = headers['svix-id'] as string;
    const svixTimestamp = headers['svix-timestamp'] as string;
    const svixSignature = headers['svix-signature'] as string;

    // Validate required headers
    if (!svixId || !svixTimestamp || !svixSignature) {
      console.warn('⚠️  Missing Svix headers - potential unauthorized request');
      return res.status(401).json({ error: 'Missing webhook headers' });
    }

    // Verify webhook signature
    const wh = new Webhook(webhookSecret);
    let event;

    try {
      event = wh.verify(JSON.stringify(payload), {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as any;
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.error('🔴 Webhook signature verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      throw err;
    }

    const { type, data } = event;

    console.log(`📨 Received Clerk webhook: ${type}`, {
      userId: data.id,
      timestamp: new Date().toISOString()
    });

    // Route to appropriate handler
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      
      case 'organizationMembership.created':
      case 'organizationMembership.updated':
        console.log('📘 Organization membership event (not yet implemented):', type);
        break;
      
      default:
        console.warn(`⚠️  Unhandled webhook event type: ${type}`);
    }

    // Acknowledge receipt
    res.status(200).json({ 
      success: true,
      message: `Webhook ${type} processed successfully`,
      eventId: svixId
    });
  } catch (err) {
    console.error('🔴 Webhook processing error:', err);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

/**
 * Handle user.created event - Create new user in database
 */
async function handleUserCreated(data: any) {
  try {
    const { 
      id: clerkId, 
      email_addresses, 
      first_name, 
      last_name, 
      phone_numbers, 
      image_url 
    } = data;

    // Validate required fields
    if (!clerkId || !email_addresses?.[0]) {
      console.warn('⚠️  Incomplete user data in webhook:', { clerkId, email: email_addresses?.[0]?.email_address });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      console.log('ℹ️  User already exists:', clerkId);
      return;
    }

    const user = await User.create({
      clerkId,
      email: email_addresses[0].email_address,
      name: `${first_name || ''} ${last_name || ''}`.trim() || 'User',
      phone: phone_numbers?.[0]?.phone_number,
      avatar: image_url,
      role: 'user',
      isActive: true
    });

    console.log('✅ User created successfully:', {
      id: user._id,
      clerkId,
      email: user.email,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🔴 Error creating user from webhook:', error);
  }
}

/**
 * Handle user.updated event - Sync user changes to database
 */
async function handleUserUpdated(data: any) {
  try {
    const { 
      id: clerkId, 
      email_addresses, 
      first_name, 
      last_name, 
      phone_numbers, 
      image_url 
    } = data;

    if (!clerkId) {
      console.warn('⚠️  Missing clerkId in user.updated event');
      return;
    }

    const updateData = {
      ...(email_addresses?.[0] && { email: email_addresses[0].email_address }),
      ...(first_name || last_name) && { name: `${first_name || ''} ${last_name || ''}`.trim() },
      ...(phone_numbers?.[0] && { phone: phone_numbers[0].phone_number }),
      ...(image_url && { avatar: image_url })
    };

    const user = await User.findOneAndUpdate(
      { clerkId },
      updateData,
      { new: true, runValidators: true }
    );

    if (user) {
      console.log('✅ User updated successfully:', {
        id: user._id,
        clerkId,
        updatedFields: Object.keys(updateData),
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️  User not found for update:', clerkId);
    }
  } catch (error) {
    console.error('🔴 Error updating user from webhook:', error);
  }
}

/**
 * Handle user.deleted event - Soft delete user (set isActive to false)
 */
async function handleUserDeleted(data: any) {
  try {
    const { id: clerkId } = data;

    if (!clerkId) {
      console.warn('⚠️  Missing clerkId in user.deleted event');
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      { 
        isActive: false,
        deletedAt: new Date()
      },
      { new: true }
    );

    if (user) {
      console.log('✅ User deactivated successfully:', {
        id: user._id,
        clerkId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️  User not found for deletion:', clerkId);
    }
  } catch (error) {
    console.error('🔴 Error deactivating user from webhook:', error);
  }
}

export default router;