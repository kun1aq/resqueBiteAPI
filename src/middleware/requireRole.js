const AppError = require("../utils/AppError");

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Forbidden: insufficient role", 403));
    }

    next();
  };
}

module.exports = requireRole;