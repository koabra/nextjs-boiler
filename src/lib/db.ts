import mongoose from "mongoose";

const MONGODB_URI =
  process.env.NODE_ENV === "development"
    ? process.env.MONGODB_URI_LOCAL || process.env.MONGODB_URI
    : process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

// Define the cached mongoose connection type
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add mongoose to the global type
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  console.log("MONGODB_URI", MONGODB_URI);

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Timeout after 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    if (!MONGODB_URI) {
      throw new Error(
        "MongoDB connection string not found. Please check your environment variables."
      );
    }

    console.log(`Connecting to MongoDB...`);

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log(
          `Connected to MongoDB successfully: ${mongoose.connection.host}`
        );
        return mongoose;
      })
      .catch((error) => {
        console.error("Error connecting to MongoDB:", error.message);

        // Provide more helpful error messages based on common issues
        if (error.message.includes("ECONNREFUSED")) {
          console.error(
            "MongoDB connection refused. Please make sure MongoDB is running."
          );
          console.error(
            "If using MongoDB Atlas, check your connection string and network access settings."
          );
        }

        // Clear the promise so we can retry
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

export default connectDB;
