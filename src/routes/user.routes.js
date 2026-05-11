const express = require("express");

const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const validate = require("../middleware/validate");
const userController = require("../controllers/userController");

const router = express.Router();

router.get("/me", authenticate, userController.me);

router.get(
  "/admin",
  authenticate,
  requireRole("ADMIN"),
  userController.adminOnly
);

router.put(
  "/allergies",
  authenticate,
  validate(userController.allergySchema),
  userController.setAllergies
);

module.exports = router;