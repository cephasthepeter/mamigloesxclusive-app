import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import routes
import authRoutes from "../server/src/routes/auth.js";
import userRoutes from "../server/src/routes/user.js";
import productRoutes from "../server/src/routes/product.js";
import cartRoutes from "../server/src/routes/cart.js";
import orderRoutes from "../server/src/routes/order.js";
import adminRoutes from "../server/src/routes/admin.js";
import addressRoutes from "../server/src/routes/address.js";
import uploadsRoutes from "../server/src/routes/uploads.js";
import webhookRoutes from "../server/src/routes/webhook.js";
import { errorHandler } from "../server/src/middleware/errorHandler.js";
import { notFound } from "../server/src/middleware/notFound.js";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://mamiglo.com", "https://www.mamiglo.com"]
        : ["http://localhost:8081", "http://localhost:3000"],
    credentials: true,
  }),
);

// Webhook route MUST be before body parsing middleware
app.use("/api/webhooks", webhookRoutes);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/uploads", uploadsRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Export app for Vercel
export default app;
