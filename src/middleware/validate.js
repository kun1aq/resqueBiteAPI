const AppError = require("../utils/AppError");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    if (!result.success) {
      return next(new AppError("Validation error", 422, result.error.flatten()));
    }

    req.validated = result.data;
    next();
  };
}

module.exports = validate;