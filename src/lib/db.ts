import mongoose from "mongoose";
import dns from "node:dns";
import { getEnv } from "./env";

// Configure DNS before MongoDB connection
dns.setServers(["8.8.8.8", "8.8.4.4"]);

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache =
  globalThis.mongooseCache ?? { conn: null, promise: null };

globalThis.mongooseCache = cache;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    console.info("Connecting to MongoDB...");

    cache.promise = mongoose
      .connect(getEnv().MONGODB_URI)
      .then((connection) => {
        console.info("MongoDB connected successfully!");
        return connection;
      })
      .catch((error: unknown) => {
        cache.promise = null;

        console.error("MongoDB connection failed:", error);
        throw error;
      });
  }

  cache.conn = await cache.promise;

  return cache.conn;
}