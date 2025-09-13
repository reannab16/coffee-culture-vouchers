import mongoose from "mongoose";

let cached = (global as any)._mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) cached = (global as any)._mongoose = { conn: null, promise: null };

export async function connectDB() {
  // already connected (1) or connecting (2)
  if (mongoose.connection.readyState === 1) return mongoose;
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");
    const dbName = process.env.MONGODB_DB || "vouchers";

    cached.promise = mongoose.connect(uri, { dbName });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}