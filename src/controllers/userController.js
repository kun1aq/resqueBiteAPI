const { z } = require("zod");
const prisma = require("../config/database");

const allergySchema = z.object({
  body: z.object({
    allergies: z.array(
      z.enum([
        "PEANUTS",
        "TREE_NUTS",
        "MILK",
        "EGGS",
        "FISH",
        "SHELLFISH",
        "SOY",
        "WHEAT",
        "SESAME",
        "GLUTEN"
      ])
    )
  })
});

async function me(req, res) {
  res.json({
    success: true,
    data: req.user
  });
}

async function adminOnly(req, res) {
  res.json({
    success: true,
    message: "Admin access granted"
  });
}

async function setAllergies(req, res, next) {
  try {
    const { allergies } = req.validated.body;

    await prisma.userAllergy.deleteMany({
      where: { userId: req.user.id }
    });

    await prisma.userAllergy.createMany({
      data: allergies.map((allergen) => ({
        userId: req.user.id,
        allergen
      })),
      skipDuplicates: true
    });

    const saved = await prisma.userAllergy.findMany({
      where: { userId: req.user.id }
    });

    res.json({
      success: true,
      data: saved
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  allergySchema,
  me,
  adminOnly,
  setAllergies
};