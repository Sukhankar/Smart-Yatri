import mongoose from 'mongoose';

let isConnected = false;

/**
 * Connect to MongoDB using Mongoose.
 * Uses MONGO_URL env var and keeps a single shared connection.
 */
export async function connectMongo() {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!mongoUrl) {
    // Fail fast with a clear error so misconfiguration is obvious in logs
    throw new Error('MONGO_URL (or MONGODB_URI) is not configured in environment');
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUrl, {
      autoIndex: true,
    });
  }

  isConnected = true;
  return mongoose.connection;
}


