require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const menuRoutes = require('./src/routes/menuRoutes');
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const mongoose = require('mongoose');

// ─── MongoDB Connection ───────────────────────────────────────────────────────
// In traditional mode (local dev / always-on server): connect eagerly at startup.
// In serverless mode (Vercel): connectDB is called lazily per-request via the
// middleware below so each warm container reuses the cached connection.
const isServerless = process.env.VERCEL === '1';

if (!isServerless && process.env.NODE_ENV !== 'test') {
  connectDB().catch((err) => {
    console.warn(`⚠️ Initial MongoDB connection delayed: ${err.message}. Backend will retry on incoming requests.`);
  });
}

// ─── Core Middleware ──────────────────────────────────────────────────────────
// CORS: allow only the explicitly listed origins from CLIENT_URL env var.
// In production set CLIENT_URL to your actual Vercel frontend URL.
// No wildcard fallback — origins not in the list are rejected.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests and same-origin (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin "${origin}" is not allowed.`));
    },
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
// Raw body capture must come before express.json() parses the body.
// This is required for Razorpay webhook HMAC-SHA256 signature verification.
app.use(
  express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ─── Serverless DB Middleware ─────────────────────────────────────────────────
// On Vercel each request may hit a cold or warm container. This middleware
// ensures MongoDB is connected before any route handler runs, reusing the
// cached connection when the container is warm (no extra TCP handshake).
if (isServerless) {
  app.use(async (_req, _res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  });
}

// ─── Static Uploads (local dev only) ─────────────────────────────────────────
// Vercel's filesystem is ephemeral and read-only — local uploads are not
// persisted between invocations. In production, all images must go through
// Cloudinary. The /uploads route is kept for local development only.
if (!isServerless) {
  const uploadsPath = path.join(__dirname, 'uploads');
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      maxAge: '7d',
      etag: true,
      lastModified: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    })
  );

  // Fallback 404 for missing static upload files
  app.use('/uploads', (_req, res) => {
    res.status(404).json({ success: false, message: 'Image not found' });
  });
}

// ─── Health Check Endpoints ───────────────────────────────────────────────────
const getHealthStatus = () => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

  return {
    success: true,
    status: 'healthy',
    message: 'QuickBite API is running 🚀',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: dbStateMap[dbState] || 'unknown',
    version: '1.0.0',
  };
};

app.get('/health', (_req, res) => res.json(getHealthStatus()));
app.get('/api/health', (_req, res) => res.json(getHealthStatus()));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server (traditional / local dev mode only) ─────────────────────────
// On Vercel the serverless runtime injects requests directly — no listen() needed.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 QuickBite server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;
