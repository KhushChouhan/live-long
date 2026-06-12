const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const { error } = require('../utils/response');

const isDev = config.env === 'development';

// Generic API rate limiter
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: isDev ? 500 : config.rateLimit.max,  // Dev mein zyada allow
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return error(
      res,
      'Too many requests from this IP. Please try again after 15 minutes',
      null,
      429
    );
  }
});

// Stricter limiter for login and OTP endpoints
const authLimiter = rateLimit({
  windowMs: 600000,                // 10 minutes
  max: isDev ? 200 : 10,           // Dev: 200 requests | Prod: 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev && req.ip === '::1', // Localhost skip in dev
  handler: (req, res) => {
    return error(
      res,
      'Too many authentication attempts. Please try again after 10 minutes',
      null,
      429
    );
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};
