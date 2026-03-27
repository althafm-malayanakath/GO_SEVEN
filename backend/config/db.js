const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.__goSevenMongoose;

if (!cached) {
  cached = global.__goSevenMongoose = {
    conn: null,
    promise: null,
  };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

module.exports = connectDB;
