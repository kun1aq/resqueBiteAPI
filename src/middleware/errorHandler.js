const AppError = require("../utils/AppError");

function errorHandler(error, req, res, next) {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      details: error.details
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
}

module.exports = errorHandler;