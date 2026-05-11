const cron = require("node-cron");

const prisma = require("../config/database");

function startListingStatusJob() {
  cron.schedule("* * * * *", async () => {
    try {
      console.log("Running listing status lifecycle job...");

      const now = new Date();

      // FREE → COMPOST
      await prisma.foodListing.updateMany({
        where: {
          freeUntil: {
            lte: now
          },
          status: {
            not: "COMPOST"
          }
        },
        data: {
          status: "COMPOST"
        }
      });

      // DISCOUNTED → FREE
      await prisma.foodListing.updateMany({
        where: {
          discountedUntil: {
            lte: now
          },
          freeUntil: {
            gt: now
          },
          status: "DISCOUNTED"
        },
        data: {
          status: "FREE"
        }
      });

      // FRESH → DISCOUNTED
      await prisma.foodListing.updateMany({
        where: {
          freshUntil: {
            lte: now
          },
          discountedUntil: {
            gt: now
          },
          status: "FRESH"
        },
        data: {
          status: "DISCOUNTED"
        }
      });

      console.log("Listing lifecycle update completed");
    } catch (error) {
      console.error("Lifecycle job error:", error);
    }
  });
}

module.exports = startListingStatusJob;