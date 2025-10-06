import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

async function connectDB() {
  // If already connected, reuse the existing connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const opts = { bufferCommands: false };

  await mongoose.connect(MONGODB_URI, opts);
  return mongoose.connection;
}

export default connectDB;

