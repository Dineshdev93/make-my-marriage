import mongoose from "mongoose";
import { getEnv } from "./env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.mongooseCache ?? { conn: null, promise: null };
globalThis.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(getEnv().MONGODB_URI).then((connection) => connection).catch((error: unknown) => {
      cache.promise = null;
      throw error;
    });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
