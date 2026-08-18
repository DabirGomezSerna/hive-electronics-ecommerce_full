import logger, { serializeError } from "../config/logger.js";

const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;

  logger[status >= 500 ? "error" : "warn"]("request failed", {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    status,
    error: serializeError(err),
  });

  // A response was already sent (e.g. a controller that sent twice). Anything
  // written now throws ERR_HTTP_HEADERS_SENT — delegate to Express's default
  // handler, which closes the connection.
  if (res.headersSent) {
    return next(err);
  }

  // 5xx messages can carry internal detail (Mongoose CastError paths,
  // driver errors). Never expose them in production.
  const message =
    status < 500 || process.env.NODE_ENV !== "production"
      ? err.message || "Internal server error"
      : "Internal server error";

  res.status(status).json({ message, requestId: req.id });
};

export default errorHandler;
