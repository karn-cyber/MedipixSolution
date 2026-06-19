import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Cache the connection across hot reloads / serverless invocations.
type Cached = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const globalForMongoose = global as unknown as { _mongoose?: Cached };
const cached: Cached = globalForMongoose._mongoose ?? { conn: null, promise: null };
globalForMongoose._mongoose = cached;

export async function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set. Add it to your .env file.");
  }
  // Reuse a healthy connection; otherwise (re)connect.
  if (cached.conn && mongoose.connection.readyState === 1) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        dbName: "medipix",
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .catch((err) => {
        // Don't cache a rejected promise — let the next request retry.
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    throw err;
  }
  return cached.conn;
}
