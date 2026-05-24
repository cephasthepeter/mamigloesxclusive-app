import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Webhook, WebhookVerificationError } from 'svix';
import connectDB from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import User from './models/User.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/product.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/order.js';
import adminRoutes from './routes/admin.js';
import addressRoutes from './routes/address.js';
import uploadsRoutes from './routes/uploads.js';
import webhookRoutes from './routes/webhook.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB before starting the server
await connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:8081', 'http://localhost:3000'],
  credentials: true
}));

// Clerk webhook endpoint MUST be before body parsing middleware
// to receive raw body for signature verification
app.post('/api/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('🔴 CLERK_WEBHOOK_SECRET not configured');
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
      console.warn('⚠️  Missing Svix headers');
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
        console.error('🔴 Webhook signature verification failed');
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      throw err;
    }

    console.log(`📨 Received Clerk webhook: ${event.type}`);

    const { type, data } = event;

    // Handle different event types
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

    const updateData: any = {};
    if (email_addresses?.[0]) updateData.email = email_addresses[0].email_address;
    if (first_name || last_name) updateData.name = `${first_name || ''} ${last_name || ''}`.trim();
    if (phone_numbers?.[0]) updateData.phone = phone_numbers[0].phone_number;
    if (image_url) updateData.avatar = image_url;

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
 * Handle user.deleted event - Soft delete user
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
      { isActive: false },
      { new: true }
    );

    if (user) {
      console.log('✅ User deleted successfully:', {
        id: user._id,
        clerkId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️  User not found for deletion:', clerkId);
    }
  } catch (error) {
    console.error('🔴 Error deleting user from webhook:', error);
  }
}

// Webhook route MUST be before body parsing middleware
// to receive raw body for signature verification
app.use('/api/webhooks', webhookRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/uploads', uploadsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

export default app;