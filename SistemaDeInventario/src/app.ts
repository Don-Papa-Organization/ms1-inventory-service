import express, { Express, Request, Response, NextFunction } from "express";
import productRoutes from "./routes/productRoutes";
import catalogoRoutes from "./routes/catalogoRoutes";
import categoriaRoutes from "./routes/categoriaProductoRoutes";

const app: Express = express();

// Aumentar límite de body para JSON
app.use(express.json({ limit: '50mb' }));

// Middleware global para loggear todas las peticiones
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[REQUEST] ${req.method} ${req.path} - Headers: ${JSON.stringify(req.headers)}`);
  console.log(`[REQUEST] Body length: ${req.headers['content-length']}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas públicas del catálogo (sin autenticación)
app.use("/api/catalogo", catalogoRoutes);

// Rutas protegidas de productos (requieren autenticación)
app.use("/api/products", productRoutes);

// Rutas protegidas de categorías de productos (requieren autenticación)
app.use("/api/categoria", categoriaRoutes)
export default app;