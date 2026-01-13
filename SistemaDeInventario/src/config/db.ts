import mysql from "mysql2/promise";
import { Sequelize } from "sequelize-typescript";

// Import models
import {
  Producto, CategoriaProducto,
} from "../domain/models"

// Import credentials from environment variables
const DB_HOST = process.env.DB_HOST || "inventory-mysql"; 
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "MiContraseñaSegura123!";
const DB_NAME = process.env.DB_NAME || "don_papa";
const MAX_RETRIES = parseInt(process.env.DB_MAX_RETRIES || "30", 10);
const RETRY_DELAY_MS = parseInt(process.env.DB_RETRY_DELAY_MS || "2000", 10);
const SQL_LOGGING = process.env.SQL_LOGGING === "true";

export async function initializeDB() {
  // 1. Create database if it doesn't exist (with mysql2) - with retries
  let connection;
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
      });
      console.log("✅ MySQL connection established");
      break;
    } catch (error) {
      attempts++;
      console.log(`⏳ Attempt ${attempts}/${MAX_RETRIES} to connect to MySQL at ${DB_HOST}...`);
      if (attempts >= MAX_RETRIES) {
        console.error("❌ Could not connect to MySQL after multiple attempts");
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  await connection!.execute(`CREATE DATABASE IF NOT EXISTS ${DB_NAME}`);
  await connection!.end();

  // 2. Main connection with Sequelize
  const sequelize = new Sequelize({
    host: DB_HOST,
    dialect: "mysql",
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    models: [
      Producto, CategoriaProducto,
    ],
    logging: SQL_LOGGING ? console.log : false,
  });

  return sequelize;
}