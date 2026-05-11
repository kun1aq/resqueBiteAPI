const { z } = require("zod");
const prisma = require("../config/database");
const AppError = require("../utils/AppError");

const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    ingredients: z.array(z.string()),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    latitude: z.number(),
    longitude: z.number(),
    freshUntil: z.string()
  })
});

async function createListing(req, res, next) {
  try {
    if (req.user.role !== "MERCHANT") {
      throw new AppError("Only merchants can create listings", 403);
    }

    const data = req.validated.body;

    const listing = await prisma.foodListing.create({
      data: {
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        price: data.price,
        quantity: data.quantity,
        latitude: data.latitude,
        longitude: data.longitude,
        freshUntil: new Date(data.freshUntil),
        discountedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        freeUntil: new Date(Date.now() + 4 * 60 * 60 * 1000),
        merchantId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: listing
    });
  } catch (error) {
    next(error);
  }
}

async function getListings(req, res, next) {
  try {
    const listings = await prisma.foodListing.findMany({
      where: {
        status: {
          not: "COMPOST"
        }
      }
    });

    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    next(error);
  }
}
async function updateListingStatus(req, res, next) {
  try {
    const listing = await prisma.foodListing.findUnique({
      where: { id: req.params.id }
    });

    if (!listing) {
      throw new AppError("Listing not found", 404);
    }

    const now = new Date();
    let nextStatus = listing.status;

    if (now >= listing.freeUntil) {
      nextStatus = "COMPOST";
    } else if (now >= listing.discountedUntil) {
      nextStatus = "FREE";
    } else if (now >= listing.freshUntil) {
      nextStatus = "DISCOUNTED";
    } else {
      nextStatus = "FRESH";
    }

    const updated = await prisma.foodListing.update({
      where: { id: listing.id },
      data: { status: nextStatus }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
}
const allergyParserSchema = z.object({
  body: z.object({
    ingredients: z.array(z.string().min(1))
  })
});

async function checkAllergies(req, res, next) {
  try {
    const { ingredients } = req.validated.body;

    const userAllergies = await prisma.userAllergy.findMany({
      where: { userId: req.user.id }
    });

    const normalizedIngredients = ingredients.map((item) =>
      item.toLowerCase().trim()
    );

    const allergyMap = {
      PEANUTS: ["peanut", "peanuts"],
      TREE_NUTS: ["almond", "walnut", "cashew", "hazelnut"],
      MILK: ["milk", "cheese", "butter", "cream", "yogurt"],
      EGGS: ["egg", "eggs"],
      FISH: ["fish", "salmon", "tuna"],
      SHELLFISH: ["shrimp", "crab", "lobster"],
      SOY: ["soy", "soybean"],
      WHEAT: ["wheat", "flour"],
      SESAME: ["sesame"],
      GLUTEN: ["gluten", "flour", "wheat"]
    };

    const matched = [];

    for (const allergy of userAllergies) {
      const keywords = allergyMap[allergy.allergen] || [];

      const found = normalizedIngredients.some((ingredient) =>
        keywords.some((keyword) => ingredient.includes(keyword))
      );

      if (found) {
        matched.push(allergy.allergen);
      }
    }

    res.json({
      success: true,
      data: {
        safe: matched.length === 0,
        matchedAllergies: matched
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createListingSchema,
  createListing,
  getListings,
  updateListingStatus,
  allergyParserSchema,
  checkAllergies
};