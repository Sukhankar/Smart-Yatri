import dotenv from "dotenv";
import app from "./src/app.js";
import { seedRoleData } from "./src/utils/seedData.js";

// Load environment variables from .env file
dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

// Seed initial role data before starting the server
(async function startServer() {
  try {
    await seedRoleData();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to seed role data or start server:", err);
    // Exit with failure if seeding or startup fails
    // Only works if run directly in Node (not as esm/browser/etc)
    // eslint-disable-next-line no-undef
    if (typeof process !== "undefined" && process.exit) process.exit(1);
  }
})();
