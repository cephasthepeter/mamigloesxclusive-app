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

// Connect to MongoDB
// connectDB(); // TODO: Enable when MongoDB is ready

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

    // Acknowledge receipt
    res.status(200).json({ 
      success: true,
      message: `Webhook ${event.type} processed successfully`,
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