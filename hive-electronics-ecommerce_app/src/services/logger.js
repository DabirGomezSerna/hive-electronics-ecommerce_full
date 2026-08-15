const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

// NOTE: CRA's DefinePlugin only substitutes the exact expressions
// `process.env.NODE_ENV` and `process.env.REACT_APP_*`. Never destructure
// process.env here or the value will be undefined in the production bundle.
const resolveLevel = () => {
  const configured = process.env.REACT_APP_LOG_LEVEL;
  if (configured && configured in LEVELS) return LEVELS[configured];
  if (process.env.NODE_ENV === "test") return LEVELS.silent;
  if (process.env.NODE_ENV === "production") return LEVELS.error;
  return LEVELS.debug;
};

const serializeError = (error) =>
  error instanceof Error
    ? { name: error.name, message: error.message, stack: error.stack, status: error.status }
    : error;

// Single hook point for a future remote sink. Nothing is registered by default.
let sink = null;
export const setLogSink = (fn) => {
  sink = fn;
};

const emit = (level, message, context = {}) => {
  if (LEVELS[level] > resolveLevel()) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    message,
    ...context,
    ...(context.error ? { error: serializeError(context.error) } : {}),
  };

  // console.debug is hidden behind a verbosity filter in Chrome; use log.
  const method = level === "debug" ? "log" : level;
  console[method](`[${level}] ${message}`, entry);

  if (sink) {
    try {
      sink(entry);
    } catch {
      // logging must never throw
    }
  }
};

const logger = {
  error: (message, context) => emit("error", message, context),
  warn: (message, context) => emit("warn", message, context),
  info: (message, context) => emit("info", message, context),
  debug: (message, context) => emit("debug", message, context),
};

export default logger;
