import dotenv from 'dotenv';
dotenv.config({ path: './src/.env' });

import app from "./app";


const PORT = process.env.PORT;

async function startServer() {

  app.listen(Number(PORT), '0.0.0.0', () => console.log("✅ Servidor corriendo en", PORT, "puedes consumir la API Inventario"));
}

startServer()