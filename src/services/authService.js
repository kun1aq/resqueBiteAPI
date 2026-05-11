const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const prisma = require("../config/database");
const env = require("../config/env");
const AppError = require("../utils/AppError");

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      type: "refresh"
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN }
  );
}

async function registerUser({ email, username, password, role }) {

  if (role === "ADMIN") {
    throw new AppError(
      "Cannot self-register as admin",
      403
    );
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    }
  });

  if (existing) {
    throw new AppError("Email or username already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: role || "USER"
    },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      createdAt: true
    }
  });

  return user;
}

async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);

  if (!passwordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const decoded = jwt.decode(refreshToken);
  const expiresAt = new Date(decoded.exp * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt
    }
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    }
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 401);
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }

  if (payload.type !== "refresh") {
    throw new AppError("Invalid token type", 401);
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true }
  });

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new AppError("Refresh token revoked or expired", 401);
  }

  const accessToken = signAccessToken(storedToken.user);

  return { accessToken };
}

async function logoutUser(refreshToken) {
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash: hashToken(refreshToken),
      revoked: false
    },
    data: {
      revoked: true
    }
  });

  return { message: "Logged out successfully" };
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
};