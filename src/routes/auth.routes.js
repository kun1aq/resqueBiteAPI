const express = require("express");

const validate = require("../middleware/validate");
const { authLimiter } = require("../middleware/rateLimiter");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate(authController.registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(authController.loginSchema),
  authController.login
);

router.post(
  "/refresh",
  validate(authController.refreshSchema),
  authController.refresh
);

router.post(
  "/logout",
  validate(authController.refreshSchema),
  authController.logout
);

module.exports = router;