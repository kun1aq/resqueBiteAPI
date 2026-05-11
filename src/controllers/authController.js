const { z } = require("zod");

const authService = require("../services/authService");

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    username: z.string().min(3).max(30),
    password: z.string()
      .min(8)
      .regex(/[A-Z]/, "Password must contain uppercase letter")
      .regex(/[a-z]/, "Password must contain lowercase letter")
      .regex(/[0-9]/, "Password must contain number"),
    role: z.enum(["USER", "MERCHANT", "ADMIN"]).optional()
  })
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  })
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1)
  })
});

async function register(req, res, next) {
  try {
    const user = await authService.registerUser(req.validated.body);

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.validated.body);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshAccessToken(req.validated.body.refreshToken);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logoutUser(req.validated.body.refreshToken);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  register,
  login,
  refresh,
  logout
};