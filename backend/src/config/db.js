const mongoose = require('mongoose');

// Cache the connection promise across serverless and container restarts.
// A module-level variable persists for the lifetime of a warm process/container,
// allowing subsequent requests to reuse the existing connection rather than
// opening a new one on every invocation.
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

  if (!process.env.MONGODB_URI) {
    const errorMsg = 'MONGODB_URI is not set. Please provide your MongoDB Atlas connection string (mongodb+srv://...) in your environment or .env file.';
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      // Recommended Mongoose settings for containers and serverless environments
      maxPoolSize: 10,
      minPoolSize: 1,
    })
    .then((conn) => {
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((error) => {
      // Reset so the next request retries instead of hanging on a stale promise
      connectionPromise = null;
      console.error(`❌ MongoDB connection error: ${error.message}`);
      if (error.name === 'MongooseServerSelectionError' || (error.message && error.message.includes('bad auth'))) {
        console.error('💡 Atlas Troubleshooting Tip:');
        console.error('   1. Check MongoDB Atlas -> Network Access: ensure your current IP or 0.0.0.0/0 is whitelisted.');
        console.error('   2. Verify the database username and password in MONGODB_URI.');
      }
      throw error;
    });

  return connectionPromise;
};

module.exports = connectDB;
