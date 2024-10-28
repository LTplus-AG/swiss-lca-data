import express from "express";
import apiRoutes from "./api/routes";
import { checkForUnusualPatterns } from "./services/alertService";

const app = express();

// Middleware and routes
app.use(express.json());
app.use("/api", apiRoutes);

// Periodically check for unusual patterns (e.g., every hour)
setInterval(() => {
  // Fetch all customer IDs from your database and check for unusual patterns
  const customerIds = ["customer1", "customer2"]; // Replace with actual customer IDs
  customerIds.forEach((customerId) => checkForUnusualPatterns(customerId));
}, 3600 * 1000); // Check every hour

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
