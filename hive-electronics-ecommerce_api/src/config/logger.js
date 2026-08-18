const LEVELS = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };

const resolveLevel = () => {
  const configured = (process.env.LOG_LEVEL || "").toLowerCase();
  if (configured in LEVELS) return LEVELS[configured];
  if (process.env.NODE_ENV === "test") return LEVELS.silent;
  if (process.env.NODE_ENV === "production") return LEVELS.info;
  return LEVELS.debug;
};

const serializeError = (error) => {
  if (!(error instanceof Error)) return { message: String(error) };
  return { name: error.name, message: error.message, stack: error.stack, code: error.code };
};

const write = (level, message, meta = {}) => {
  if (LEVELS[level] > resolveLevel()) return;

  const entry = { level, time: new Date().toISOString(), message, ...meta };
  const line =
    process.env.NODE_ENV === "production"
      ? JSON.stringify(entry)
      : `${entry.time} ${level.toUpperCase()} ${message}` +
        (Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "");

  if (level === "error") console.error(line);
  else console.log(line);
};

const logger = {
  error: (message, meta) => write("error", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  info: (message, meta) => write("info", message, meta),
  debug: (message, meta) => write("debug", message, meta),
};

export { serializeError };
export default logger;
