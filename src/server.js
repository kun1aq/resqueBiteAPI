const startListingStatusJob = require("./jobs/listingStatus.job");
const app = require("./app");
const env = require("./config/env");
require("./config/redis");

app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT}`);
  console.log(`Swagger UI: http://localhost:${env.PORT}/docs`);
});
startListingStatusJob();