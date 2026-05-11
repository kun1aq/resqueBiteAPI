const { z } = require("zod");
const prisma = require("../config/database");
const redis = require("../config/redis");
const AppError = require("../utils/AppError");

const createReservationSchema = z.object({
  body: z.object({
    listingId: z.string(),
    quantity: z.number().int().positive()
  })
});

async function createReservation(req, res, next) {
  try {
    const { listingId, quantity } = req.validated.body;

    const lockKey = `lock:listing:${listingId}`;

    const lockCreated = await redis.set(lockKey, "1", "NX", "EX", 5);

    if (!lockCreated) {
      throw new AppError("Listing is being reserved, try again", 429);
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const listing = await tx.foodListing.findUnique({
          where: { id: listingId }
        });

        if (!listing) {
          throw new AppError("Listing not found", 404);
        }

        if (listing.status === "COMPOST") {
          throw new AppError("Listing is no longer available", 409);
        }

        if (listing.quantity < quantity) {
          throw new AppError("Not enough stock", 409);
        }

        const updatedListing = await tx.foodListing.update({
          where: { id: listingId },
          data: {
            quantity: listing.quantity - quantity
          }
        });

        const reservation = await tx.stockReservation.create({
          data: {
            quantity,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            userId: req.user.id,
            listingId
          }
        });

        return { reservation, updatedListing };
      });

      await redis.set(
        `reservation:${result.reservation.id}`,
        JSON.stringify({
          listingId,
          quantity,
          userId: req.user.id
        }),
        "EX",
        600
      );

      res.status(201).json({
        success: true,
        data: result
      });
    } finally {
      await redis.del(lockKey);
    }
  } catch (error) {
    next(error);
  }
}

async function confirmReservation(req, res, next) {
  try {
    const { id } = req.params;

    const reservation = await prisma.stockReservation.findUnique({
      where: { id },
      include: { listing: true }
    });

    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    if (reservation.userId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("Forbidden", 403);
    }

    if (reservation.status !== "ACTIVE") {
      throw new AppError("Only active reservations can be confirmed", 409);
    }

    if (reservation.expiresAt < new Date()) {
      await prisma.stockReservation.update({
        where: { id },
        data: { status: "EXPIRED" }
      });

      throw new AppError("Reservation expired", 409);
    }

    const updated = await prisma.stockReservation.update({
      where: { id },
      data: { status: "CONFIRMED" }
    });

    await redis.del(`reservation:${id}`);

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}

async function cancelReservation(req, res, next) {
  try {
    const { id } = req.params;

    const reservation = await prisma.stockReservation.findUnique({
      where: { id }
    });

    if (!reservation) {
      throw new AppError("Reservation not found", 404);
    }

    if (reservation.userId !== req.user.id && req.user.role !== "ADMIN") {
      throw new AppError("Forbidden", 403);
    }

    if (reservation.status !== "ACTIVE") {
      throw new AppError("Only active reservations can be cancelled", 409);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedReservation = await tx.stockReservation.update({
        where: { id },
        data: { status: "CANCELLED" }
      });

      const updatedListing = await tx.foodListing.update({
        where: { id: reservation.listingId },
        data: {
          quantity: {
            increment: reservation.quantity
          }
        }
      });

      return { updatedReservation, updatedListing };
    });

    await redis.del(`reservation:${id}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function myReservations(req, res, next) {
  try {
    const reservations = await prisma.stockReservation.findMany({
      where: { userId: req.user.id },
      include: {
        listing: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      success: true,
      data: reservations
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReservationSchema,
  createReservation,
  confirmReservation,
  cancelReservation,
  myReservations
};