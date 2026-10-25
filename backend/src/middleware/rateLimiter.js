// In-memory rate limiter for sensitive endpoints (e.g. login, register)
const rateLimitMap = new Map();

// Periodically clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = 'Too many requests from this IP. Please try again later.',
} = {}) => {
  return (req, res, next) => {
    // In test environment, do not throttle tests
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip =
      req.ip ||
      req.headers['x-forwarded-for'] ||
      req.connection?.remoteAddress ||
      'unknown';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(key, record);
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    next();
  };
};

module.exports = {
  authLimiter: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 25,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  }),
};
