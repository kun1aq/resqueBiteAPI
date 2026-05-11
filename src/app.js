const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const env = require("./config/env");
const errorHandler = require("./middleware/errorHandler");
const AppError = require("./utils/AppError");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RescueBite API is running"
  });
});
app.use("/auth", require("./routes/auth.routes"));
app.use("/users", require("./routes/user.routes"));
app.use("/listings", require("./routes/listing.routes"));
app.use("/reservations", require("./routes/order.routes"));
app.use("/admin", require("./routes/admin.routes"));

try {
  const swaggerDocument = YAML.load("openapi.yaml");
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  console.warn("Swagger file not loaded yet:", error.message);
}

app.use((req, res, next) => {
  next(new AppError("Route not found", 404));
});

app.use(errorHandler);

module.exports = app;