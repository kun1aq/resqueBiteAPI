const prisma = require("../config/database");

async function getAllUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
}

async function getAllReservations(req, res, next) {
  try {
    const reservations = await prisma.stockReservation.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true
          }
        },
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

async function getSystemStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalListings,
      totalReservations,
      activeListings,
      compostListings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.foodListing.count(),
      prisma.stockReservation.count(),
      prisma.foodListing.count({
        where: {
          status: {
            not: "COMPOST"
          }
        }
      }),
      prisma.foodListing.count({
        where: {
          status: "COMPOST"
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalListings,
        totalReservations,
        activeListings,
        compostListings
      }
    });
  } catch (error) {
    next(error);
  }
}

async function compostListing(req, res, next) {
  try {
    const listing = await prisma.foodListing.update({
      where: {
        id: req.params.id
      },
      data: {
        status: "COMPOST"
      }
    });

    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
}

async function deleteListing(req, res, next) {
  try {
    const listing = await prisma.foodListing.findUnique({
      where: {
        id: req.params.id
      }
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: "Listing not found"
      });
    }

    await prisma.foodListing.delete({
      where: {
        id: req.params.id
      }
    });

    res.json({
      success: true,
      message: "Listing deleted successfully"
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllUsers,
  getAllReservations,
  getSystemStats,
  compostListing,
  deleteListing
};