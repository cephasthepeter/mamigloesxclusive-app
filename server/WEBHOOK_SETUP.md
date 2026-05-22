# Clerk Webhook Setup Guide

This guide explains how to configure Clerk webhooks to sync user data to your application database.

## Overview

The webhook system automatically synchronizes user data from Clerk to your MongoDB database. When users are created, updated, or deleted in Clerk, the corresponding changes are reflected in your app's database.

### Supported Events

- **user.created** - Creates new user record in database
- **user.updated** - Updates existing user data (email, name, phone, avatar)
- **user.deleted** - Soft deletes user (sets `isActive: false`, records `deletedAt`)

## Step 1: Get Your Webhook Secret

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** (under Integrations or Settings)
3. Click **Create Endpoint**
4. Fill in the details:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
     - For local development: `http://localhost:3000/api/webhooks/clerk`
     - For production: Use your actual domain
   - **Events to subscribe to**: Select
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
5. Click **Create**
6. Copy the **Signing Secret** (starts with `whsec_`)

## Step 2: Configure Environment Variable

Add the webhook secret to your `.env` file in the `server` folder:

```env
CLERK_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

Replace `whsec_your_actual_secret_here` with the secret you copied in Step 1.

## Step 3: Test the Webhook

### For Local Development

If testing locally, you'll need to expose your local server to the internet using a tunneling service:

**Option A: Using ngrok (Recommended)**

```bash
# Install ngrok: https://ngrok.com/download

# Start your server
npm run dev

# In another terminal, tunnel to localhost:3000
ngrok http 3000

# Copy the forwarding URL (e.g., https://abc123.ngrok.io)
# Update Clerk webhook endpoint URL to: https://abc123.ngrok.io/api/webhooks/clerk
```

**Option B: Using localtunnel**

```bash
# Install globally
npm install -g localtunnel

# Start your server
npm run dev

# In another terminal, expose your server
lt --port 3000 --subdomain your-app-name

# Update Clerk webhook endpoint URL to: https://your-app-name.loca.lt/api/webhooks/clerk
```

### Trigger Test Events

In Clerk Dashboard:

1. Go to **Webhooks**
2. Find your endpoint
3. Click the endpoint to view details
4. Click **Test Endpoint** to send a test event
5. Check server logs for webhook processing

Expected log output:

```
📨 Received Clerk webhook: user.created
✅ User created successfully: { id: '...', clerkId: 'user_xxx', email: 'test@example.com' }
```

## Step 4: Database Schema

The webhook syncs the following fields:

| Field       | Source                           | Description                          |
| ----------- | -------------------------------- | ------------------------------------ |
| `clerkId`   | Clerk `id`                       | Unique identifier from Clerk         |
| `email`     | Clerk `email_addresses[0]`       | Primary email address                |
| `name`      | Clerk `first_name` + `last_name` | Full name                            |
| `phone`     | Clerk `phone_numbers[0]`         | Primary phone number                 |
| `avatar`    | Clerk `image_url`                | Profile picture URL                  |
| `role`      | Default `'user'`                 | User role (can be 'user' or 'admin') |
| `isActive`  | Default `true`                   | Account status (false when deleted)  |
| `deletedAt` | On deletion                      | Timestamp when user was soft-deleted |

## Step 5: Troubleshooting

### Webhook Not Triggering

1. **Check Clerk Dashboard**: Verify the endpoint is active and enabled
2. **Verify URL**: Ensure your endpoint URL is publicly accessible
3. **Check Signing Secret**: Confirm `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard value
4. **Check Logs**: Monitor server console for error messages

### Signature Verification Failed

```
🔴 Webhook signature verification failed: Invalid signature
```

**Solutions:**

- Verify the signing secret in `.env` matches exactly (including `whsec_` prefix)
- Ensure the secret is from the correct environment (Test/Production)
- Check that `CLERK_WEBHOOK_SECRET` is loaded: Add console log in webhook route

### MongoDB Connection Issues

If webhook handlers fail to save users:

1. Ensure MongoDB connection is enabled in `server/src/server.ts`
2. Check `MONGODB_URI` in `.env`
3. Verify MongoDB Atlas IP whitelist includes your server's IP
4. Check database logs for connection errors

## Webhook Payload Example

When a user is created in Clerk, the webhook receives:

```json
{
  "type": "user.created",
  "data": {
    "id": "user_2abc123def456",
    "email_addresses": [
      {
        "id": "idn_123abc",
        "email_address": "user@example.com",
        "primary": true
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "phone_numbers": [
      {
        "id": "phn_123abc",
        "phone_number": "+1234567890"
      }
    ],
    "image_url": "https://img.clerk.com/users/user_2abc123def456"
  }
}
```

## Security Notes

1. **Signature Verification**: All webhooks are verified using the signing secret (cryptographic signing)
2. **Rate Limiting**: The `/api/webhooks` endpoint is excluded from general rate limits to prevent dropping legitimate events
3. **Soft Deletes**: Users are never permanently deleted - only marked as inactive
4. **Data Validation**: Webhook handlers validate required fields before processing

## Production Deployment

When deploying to production:

1. **Use Production Clerk Keys**: Switch from test keys to production keys
2. **Use Production Signing Secret**: Create webhook endpoint in production Clerk environment
3. **Update Webhook URL**: Point to your production domain
4. **Enable MongoDB**: Uncomment `connectDB()` in `server/src/server.ts`
5. **Monitor Webhooks**: Check Clerk Dashboard for webhook delivery status

## Advanced: Custom Event Handling

To add custom logic for specific events, modify the switch statement in `server/src/routes/webhook.ts`:

```typescript
case 'user.created':
  await handleUserCreated(data);
  // Add your custom logic here
  break;
```

## Support

For Clerk-related issues: [Clerk Documentation](https://clerk.com/docs/webhooks/overview)

For webhook testing: Use Clerk Dashboard's test endpoint feature or ngrok for local testing
