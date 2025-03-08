import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://paramsavjani:parampbr**@cricket.sl88y.mongodb.net/CRICKET";

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const cached: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null } = {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then((mongoose) => {
      return mongoose.connection;
    });
  }
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
}