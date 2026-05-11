const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Try again later."
  }
});

module.exports = {
  authLimiter
};