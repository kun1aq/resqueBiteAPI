const jwt = require("jsonwebtoken");

const env = require("../config/env");
const prisma = require("../config/database");
const AppError = require("../utils/AppError");

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError("Access token is required", 401));
  }

  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, username: true, role: true }
    });

    if (!user) {
      return next(new AppError("User not found", 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError("Invalid or expired access token", 401));
  }
}

module.exports = authenticate;