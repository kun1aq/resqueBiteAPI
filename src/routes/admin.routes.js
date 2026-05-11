const express = require("express");

const authenticate = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/users", adminController.getAllUsers);

router.get("/reservations", adminController.getAllReservations);

router.get("/stats", adminController.getSystemStats);

router.patch(
  "/listings/:id/compost",
  adminController.compostListing
);
router.delete(
  "/listings/:id",
  adminController.deleteListing
);

module.exports = router;