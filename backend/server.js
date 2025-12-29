import dotenv from "dotenv";
import app from "./src/app.js";
import { seedRoleData, seedSystemSettings } from "./src/utils/seedData.js";

// Load environment variables from .env file
dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

// Seed initial role data before starting the server
(async function startServer() {
  try {
    await seedRoleData();
    await seedSystemSettings();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to seed data or start server:", err);
    // Exit with failure if seeding or startup fails
    if (typeof process !== "undefined" && process.exit) process.exit(1);
  }
})();
