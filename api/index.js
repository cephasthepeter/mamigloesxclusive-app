import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { Webhook, WebhookVerificationError } from "svix";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

const app = express();

// MongoDB Connection
let mongoConnected = false;

const connectDB = async () => {
  if (mongoConnected) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    mongoConnected = true;
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
};

// Import User model
import User from "../server/dist/models/User.js";

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["https://mamiglo.com", "https://www.mamiglo.com"]
        : ["http://localhost:8081", "http://localhost:3000", "*"],
    credentials: true,
  }),
);

// Clerk webhook endpoint MUST be before body parsing
// to receive raw body for signature verification
app.post(
  "/api/clerk",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      await connectDB();

      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error("🔴 CLERK_WEBHOOK_SECRET not configured");
        return res.status(500).json({
          error: "Webhook configuration error",
          message: "CLERK_WEBHOOK_SECRET is not set",
        });
      }

      const payload = req.body;
      const headers = req.headers;

      const svixId = headers["svix-id"];
      const svixTimestamp = headers["svix-timestamp"];
      const svixSignature = headers["svix-signature"];

      if (!svixId || !svixTimestamp || !svixSignature) {
        console.warn("⚠️  Missing Svix headers");
        return res.status(401).json({ error: "Missing webhook headers" });
      }

      // Verify webhook signature
      const wh = new Webhook(webhookSecret);
      let event;

      try {
        event = wh.verify(JSON.stringify(payload), {
          "svix-id": svixId,
          "svix-timestamp": svixTimestamp,
          "svix-signature": svixSignature,
        });
      } catch (err) {
        if (err instanceof WebhookVerificationError) {
          console.error("🔴 Webhook signature verification failed");
          return res.status(401).json({ error: "Invalid webhook signature" });
        }
        throw err;
      }

      console.log(`📨 Received Clerk webhook: ${event.type}`);

      const { type, data } = event;

      // Handle different event types
      switch (type) {
        case "user.created":
          await handleUserCreated(data);
          break;

        case "user.updated":
          await handleUserUpdated(data);
          break;

        case "user.deleted":
          await handleUserDeleted(data);
          break;

        default:
          console.warn(`⚠️  Unhandled webhook event type: ${type}`);
      }

      // Acknowledge receipt
      res.status(200).json({
        success: true,
        message: `Webhook ${type} processed successfully`,
        eventId: svixId,
      });
    } catch (err) {
      console.error("🔴 Webhook processing error:", err);
      res.status(500).json({
        error: "Failed to process webhook",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  },
);

// Handle user.created event
async function handleUserCreated(data) {
  try {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      phone_numbers,
      image_url,
    } = data;

    if (!clerkId || !email_addresses?.[0]) {
      console.warn("⚠️  Incomplete user data:", { clerkId });
      return;
    }

    const existingUser = await User.findOne({ clerkId });
    if (existingUser) {
      console.log("ℹ️  User already exists:", clerkId);
      return;
    }

    const user = await User.create({
      clerkId,
      email: email_addresses[0].email_address,
      name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      phone: phone_numbers?.[0]?.phone_number,
      avatar: image_url,
      role: "user",
      isActive: true,
    });

    console.log("✅ User created:", {
      id: user._id,
      clerkId,
      email: user.email,
    });
  } catch (error) {
    console.error("🔴 Error creating user:", error);
  }
}

// Handle user.updated event
async function handleUserUpdated(data) {
  try {
    const {
      id: clerkId,
      email_addresses,
      first_name,
      last_name,
      phone_numbers,
      image_url,
    } = data;

    if (!clerkId) {
      console.warn("⚠️  Missing clerkId in user.updated");
      return;
    }

    const updateData = {};
    if (email_addresses?.[0])
      updateData.email = email_addresses[0].email_address;
    if (first_name || last_name)
      updateData.name = `${first_name || ""} ${last_name || ""}`.trim();
    if (phone_numbers?.[0]) updateData.phone = phone_numbers[0].phone_number;
    if (image_url) updateData.avatar = image_url;

    const user = await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });

    if (user) {
      console.log("✅ User updated:", { clerkId });
    } else {
      console.warn("⚠️  User not found for update:", clerkId);
    }
  } catch (error) {
    console.error("🔴 Error updating user:", error);
  }
}

// Handle user.deleted event
async function handleUserDeleted(data) {
  try {
    const { id: clerkId } = data;

    if (!clerkId) {
      console.warn("⚠️  Missing clerkId in user.deleted");
      return;
    }

    const user = await User.findOneAndUpdate(
      { clerkId },
      { isActive: false },
      { new: true },
    );

    if (user) {
      console.log("✅ User deleted:", { clerkId });
    } else {
      console.warn("⚠️  User not found for deletion:", clerkId);
    }
  } catch (error) {
    console.error("🔴 Error deleting user:", error);
  }
}

// Rate limiting (AFTER webhook to avoid limiting webhook)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
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

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Mamiglo E-commerce API",
    version: "1.0.0",
    status: "operational",
  });
});

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Export app for Vercel
export default app;
