const express = require("express");

const authenticate = require("../middleware/auth");
const validate = require("../middleware/validate");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  validate(orderController.createReservationSchema),
  orderController.createReservation
);

router.get(
  "/my",
  authenticate,
  orderController.myReservations
);

router.patch(
  "/:id/confirm",
  authenticate,
  orderController.confirmReservation
);

router.patch(
  "/:id/cancel",
  authenticate,
  orderController.cancelReservation
);

module.exports = router;