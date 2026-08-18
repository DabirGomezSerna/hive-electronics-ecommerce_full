import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "./src/config/db.conf.js";
import createApp from "./src/app.js";
import logger, { serializeError } from "./src/config/logger.js";

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 3000;

// connectDB() has its own try/catch, but was previously called un-awaited
// with no .catch — a rejection thrown before that internal try/catch (e.g. a
// synchronous URI parse error) would have been an unhandled rejection.
connectDB().catch((error) => {
  logger.error("Startup: database connection failed", { error: serializeError(error) });
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info("Server started", { port: PORT, env: process.env.NODE_ENV || "development" });
});

server.on("error", (error) => {
  logger.error("HTTP server error", { error: serializeError(error) });
  process.exit(1);
});

const shutdown = (signal) => {
  logger.info("Shutdown signal received", { signal });
  server.close(async () => {
    await mongoose.connection.close().catch(() => {});
    logger.info("Shutdown complete");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Shutdown timed out, forcing exit");
    process.exit(1);
  }, 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { error: serializeError(reason) });
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: serializeError(error) });
  process.exit(1);
});
