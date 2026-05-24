# MongoDB Persistence & Clerk Webhook Testing Guide

## ✅ Deployment Status

- **API Live:** https://mamiglo-ecommerce-app.vercel.app
- **Health Check:** `/health` endpoint returns 200 OK
- **MongoDB:** Connected via `connectDB()` in server.ts
- **Webhook:** Ready at `POST /api/clerk` with Svix signature verification

## Testing MongoDB Persistence

### Option 1: Test via Clerk Dashboard (Recommended)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **Webhooks** → **Endpoints**
3. Find your endpoint URL: `https://mamiglo-ecommerce-app.vercel.app/api/clerk`
4. Click **Send Test Event**
5. Select **user.created** event
6. Click **Send**
7. Check the response - should return 200 with success message

### Option 2: Verify Users in MongoDB

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Connect to your cluster
3. Open the database and `users` collection
4. Look for documents with the format:
   ```json
   {
     "clerkId": "user_...",
     "email": "user@example.com",
     "name": "User Name",
     "role": "user",
     "isActive": true
   }
   ```

### Option 3: Check Server Logs

On Vercel dashboard:

1. Go to **Deployments**
2. Click latest deployment
3. View **Function Logs**
4. Look for messages like:
   - `📨 Received Clerk webhook: user.created`
   - `✅ User created successfully`
   - Any `🔴 Error` messages would indicate issues

## Webhook Event Flow

When a user is created in Clerk:

1. Clerk sends webhook to `/api/clerk`
2. Server verifies Svix signature
3. Extracts user data (email, name, phone, avatar)
4. Creates User document in MongoDB
5. Returns 200 success response

## Handlers Implemented

### ✅ user.created

- Creates new user in MongoDB
- Checks for duplicates
- Stores: clerkId, email, name, phone, avatar, role

### ✅ user.updated

- Updates existing user record
- Syncs all fields from Clerk
- Uses clerkId as lookup key

### ✅ user.deleted

- Soft-deletes user (sets isActive: false)
- Preserves user history

## Environment Variables Required

Make sure these are set in Vercel:

- `MONGODB_URI` - MongoDB connection string ✅
- `CLERK_WEBHOOK_SECRET` - From Clerk Dashboard ✅
- `NODE_ENV` - Set to "production" ✅

## Expected Webhook Response

```json
{
  "success": true,
  "message": "Webhook user.created processed successfully",
  "eventId": "msg_..."
}
```

## Troubleshooting

### Issue: 401 Unauthorized

- Check if `CLERK_WEBHOOK_SECRET` is correctly set in Vercel
- Verify Clerk webhook secret matches environment variable

### Issue: 500 Internal Error

- Check MongoDB connection in logs
- Verify MongoDB credentials are correct

### Issue: User not appearing in MongoDB

- Check Vercel logs for processing errors
- Verify MongoDB connection string is valid
- Check if user document was created with `clerkId` field

## Next Steps

1. **Test with real Clerk user:** Create a new user in your app and check MongoDB
2. **Monitor logs:** Watch Vercel function logs for webhook events
3. **Verify data:** Query MongoDB to confirm users are persisting
4. **Set up production domain:** Update CORS origin in server.ts to your domain
