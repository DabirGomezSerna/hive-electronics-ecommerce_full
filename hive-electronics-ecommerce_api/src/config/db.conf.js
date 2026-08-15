import mongoose from "mongoose";
import dotenv from "dotenv";
import logger, { serializeError } from "./logger.js";

dotenv.config();

mongoose.connection.on("error", (error) =>
  logger.error("MongoDB connection error", { error: serializeError(error) }),
);
mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
mongoose.connection.on("reconnected", () => logger.info("MongoDB reconnected"));

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hiveElectronicsDB";
  try {
    const connection = await mongoose.connect(uri);
    logger.info("MongoDB connected", { host: connection.connection.host });
  } catch (error) {
    // The original code discarded this object entirely — the cause was lost.
    logger.error("MongoDB connection failed", { error: serializeError(error) });
    process.exit(1);
  }
};

export default connectDB;
