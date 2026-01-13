import dotenv from 'dotenv';
dotenv.config();

import app from "./app";


const PORT = process.env.PORT || 4001;

async function startServer() {
  // Initialize Database and sync models in development
  try {
    const { initializeDB } = await import("./config/db");
    const sequelize = await initializeDB();
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("✅ Models synchronized with database");
    }
  } catch (err) {
    console.error("❌ Error initializing database:", err);
  }

  app.listen(Number(PORT), '0.0.0.0', () => console.log(`✅ Inventory Service running on port ${PORT}`));
}

startServer()