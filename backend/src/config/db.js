const mongoose = require('mongoose');

// Cache the connection promise across serverless invocations.
// A module-level variable persists for the lifetime of a warm container,
// allowing subsequent requests to reuse the existing connection rather than
// opening a new one on every invocation (critical for Vercel / Lambda).
let connectionPromise = null;

const connectDB = async () => {
  // Already connected — reuse the existing connection
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Connection in progress — wait for it instead of opening a second one
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      // Recommended Mongoose settings for serverless environments
      maxPoolSize: 10,
      minPoolSize: 1,
    })
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    })
    .catch((error) => {
      // Reset so the next request retries instead of hanging on a stale promise
      connectionPromise = null;
      // Throw — let the request fail with a 503 rather than killing the process.
      // process.exit(1) is intentionally removed: in serverless environments it
      // permanently destroys the function container for all subsequent requests.
      console.error(`❌ MongoDB connection error: ${error.message}`);
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
