import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongoose:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose;

  if (!global._mongoose) {
    global._mongoose = { conn: null, promise: null };
  }

  if (global._mongoose.conn) return global._mongoose.conn;

  if (!global._mongoose.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");
    const dbName = process.env.MONGODB_DB || "vouchers";
    global._mongoose.promise = mongoose.connect(uri, { dbName });
  }

  global._mongoose.conn = await global._mongoose.promise;
  return global._mongoose.conn;
}