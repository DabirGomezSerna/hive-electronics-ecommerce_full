import { randomUUID } from "node:crypto";
import logger from "../config/logger.js";

const requestLogger = (req, res, next) => {
  const startedAt = process.hrtime.bigint();

  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("X-Request-Id", req.id);

  res.on("finish", () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - startedAt) / 1e6);
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger[level]("request", {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
      userId: req.user?.userId,
    });
  });

  next();
};

export default requestLogger;
