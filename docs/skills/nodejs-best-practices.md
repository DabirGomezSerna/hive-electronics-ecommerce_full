# Node.js Best Practices - Production Ready Code

**Scope:** backend
**Trigger:** when working with Node.js, configuring a backend project, or Node best practices are needed
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.0.0

---

## Purpose

This skill guides writing production-grade Node.js code following industry best practices. It covers project structure, error handling, logging, security, performance, and deployment.

## When to Use This Skill

- Setting up a new Node.js project
- Implementing logging and monitoring
- Optimizing Node application performance
- Preparing code for production
- Debugging memory leaks or performance issues
- Configuring environment variables
- Implementing graceful shutdown

## Context and Knowledge

### Professional Project Structure

```
project-root/
├── src/
│   ├── config/           # Configuration
│   ├── controllers/      # Business logic
│   ├── middleware/       # Custom middleware
│   ├── models/           # Data models
│   ├── routes/           # Route definitions
│   ├── services/         # External services
│   ├── utils/            # Utilities and helpers
│   ├── validators/       # Validations
│   └── server.js         # Entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── logs/                 # Application logs
├── .env                  # Environment variables (gitignored)
├── .env.example          # .env template
├── .eslintrc.js          # ESLint config
├── .prettierrc           # Prettier config
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

### Configuration with dotenv

**config/index.js:**
```javascript
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  db: {
    uri: process.env.MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required configuration
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

module.exports = config;
```

**.env.example:**
```bash
# Application
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/myapp

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Professional Logging

### Winston Logger Setup

```bash
npm install winston winston-daily-rotate-file
```

**config/logger.js:**
```javascript
const winston = require('winston');
const path = require('path');

const logDir = 'logs';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '14d',
    }),

    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
});

// Console log in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: consoleFormat }));
}

module.exports = logger;
```

**Using the Logger:**
```javascript
const logger = require('./config/logger');

logger.info('Server started', { port: 5000 });
logger.warn('Cache miss', { key: 'user:123' });
logger.error('Database connection failed', { error: err.message });

// In controllers
exports.createUser = async (req, res, next) => {
  try {
    logger.info('Creating new user', { email: req.body.email });
    const user = await User.create(req.body);
    logger.info('User created successfully', { userId: user._id });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    logger.error('User creation failed', {
      error: error.message,
      stack: error.stack,
      body: req.body,
    });
    next(error);
  }
};
```

## Robust Error Handling

### Custom Error Class

**utils/AppError.js:**
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Global Error Handler

**middleware/errorHandler.js:**
```javascript
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational errors: send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }
  // Programming errors: don't leak details
  else {
    logger.error('ERROR', { error: err });
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      error = new AppError('Invalid ID format', 400);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      error = new AppError(`Duplicate field value: ${field}`, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map((el) => el.message);
      error = new AppError(`Invalid input data: ${errors.join('. ')}`, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401);
    }
    if (err.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401);
    }

    sendErrorProd(error, res);
  }
};

module.exports = errorHandler;
```

### Async Error Wrapper

**utils/catchAsync.js:**
```javascript
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
```

**Usage:**
```javascript
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({ success: true, data: user });
});
```

## Performance Optimization

### Event Loop Best Practices

```javascript
// BAD - Blocks the event loop
app.get('/bad', (req, res) => {
  const result = heavySyncOperation(); // Blocks everything
  res.json(result);
});

// GOOD - Async/non-blocking
app.get('/good', async (req, res) => {
  const result = await heavyAsyncOperation();
  res.json(result);
});

// For CPU-intensive operations, use worker threads
const { Worker } = require('worker_threads');

app.get('/heavy', (req, res) => {
  const worker = new Worker('./heavy-task.js');

  worker.on('message', (result) => {
    res.json(result);
  });

  worker.on('error', (error) => {
    res.status(500).json({ error: error.message });
  });

  worker.postMessage(req.body);
});
```

### Caching Strategies

```javascript
// Simple in-memory cache
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

exports.getUsers = catchAsync(async (req, res, next) => {
  // Check cache
  const cachedUsers = cache.get('all_users');
  if (cachedUsers) {
    logger.info('Cache hit: all_users');
    return res.status(200).json({ success: true, cached: true, data: cachedUsers });
  }

  // No cache, fetch from DB
  const users = await User.find();
  cache.set('all_users', users);

  logger.info('Cache miss: all_users');
  res.status(200).json({ success: true, cached: false, data: users });
});
```

### Database Connection Pooling

```javascript
// Mongoose with pooling
const mongoose = require('mongoose');

const connectDB = async () => {
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10, // Maximum connections
    minPoolSize: 5,  // Minimum connections
    socketTimeoutMS: 45000,
    serverSelectionTimeoutMS: 5000,
  };

  await mongoose.connect(process.env.MONGO_URI, options);
  logger.info('MongoDB connected with connection pooling');
};
```

## Security Best Practices

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

// Redis client (for scalable apps)
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// General rate limiter
const limiter = rateLimit({
  store: new RedisStore({ client: redisClient }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: 'Too many requests from this IP',
});

// Strict rate limiter for auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts',
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
```

### Helmet - Security Headers

```javascript
const helmet = require('helmet');

app.use(helmet());

// Custom configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
```

### Input Sanitization

```javascript
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// Validation with express-validator
const { body, validationResult } = require('express-validator');

const validateUser = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().escape(),
];

app.post('/users', validateUser, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Process...
});
```

## Graceful Shutdown

**server.js:**
```javascript
const logger = require('./config/logger');

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', {
    error: err.message,
    stack: err.stack,
  });

  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: err.message,
    stack: err.stack,
  });

  process.exit(1);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');

  server.close(() => {
    logger.info('Process terminated');
  });
});
```

## Package.json Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "format": "prettier --write \"**/*.js\"",
    "prepare": "husky install"
  }
}
```

## Testing Setup

```bash
npm install -D jest supertest
```

**jest.config.js:**
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Memory leak | Event listeners not removed | Always clean up listeners |
| Blocked event loop | Heavy synchronous operation | Use async or worker threads |
| Unhandled rejection | Promise without .catch() | Use try-catch or catchAsync |
| Port already in use | Port already occupied | Change port or kill the process |
| ECONNREFUSED | DB unavailable | Check connection and credentials |

## Production Checklist

Before deploying:
- [ ] Environment variables configured
- [ ] Logging implemented (Winston/Bunyan)
- [ ] Global error handling
- [ ] Graceful shutdown implemented
- [ ] Rate limiting configured
- [ ] Security headers (Helmet)
- [ ] Input sanitization
- [ ] CORS configured correctly
- [ ] Tests written (>70% coverage)
- [ ] Staging environment tested
- [ ] Monitoring configured (PM2, New Relic)
- [ ] Centralized logs (ELK, Datadog)

## Best Practices Summary

1. **Async/Await everywhere** - Never block the event loop
2. **Proper error handling** - Use try-catch, error middleware
3. **Environment variables** - Never hardcode secrets
4. **Logging** - Use structured logging (Winston)
5. **Security** - Helmet, rate limiting, sanitization
6. **Testing** - Unit, integration, e2e tests
7. **Linting** - ESLint + Prettier
8. **Graceful shutdown** - Handle SIGTERM properly
9. **Monitoring** - Know when things break
10. **Documentation** - README, API docs, code comments

---

**Last updated:** Phase 2 - MERN Skills
**Maintainer:** Skills System
