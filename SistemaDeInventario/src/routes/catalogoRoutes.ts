import { Router } from "express";
import { getCatalogoPublico, getDetalleProductoPublico } from "../controllers/productController";

/**
 * Rutas públicas del catálogo de productos
 * CU019 - Acceder al catálogo de productos
 * CU021 - Ver detalles de producto
 * 
 * Estas rutas NO requieren autenticación y están disponibles para cualquier usuario
 */
const router = Router();

/**
 * GET /api/catalogo
 * Obtener catálogo público de productos activos
 * 
 * Query params opcionales:
 * - categoria: number (filtrar por ID de categoría)
 * - precioMin: number (precio mínimo)
 * - precioMax: number (precio máximo)
 * - esPromocion: boolean (filtrar solo promociones)
 * - page: number (número de página, default: 1)
 * - limit: number (productos por página, default: 12)
 * - ordenarPor: 'nombre' | 'precio' | 'reciente' (campo para ordenar)
 * - orden: 'asc' | 'desc' (dirección de ordenamiento)
 * 
 * Ejemplo: /api/catalogo?categoria=1&precioMin=10&precioMax=100&page=1&limit=12&ordenarPor=precio&orden=asc
 */
router.get("/", getCatalogoPublico);

/**
 * GET /api/catalogo/:id
 * Obtener detalles públicos de un producto específico
 * CU021 - Ver detalles de producto
 * 
 * Parámetros:
 * - id: number (ID del producto)
 * 
 * Retorna toda la información del producto si está activo
 * Retorna 404 si el producto no existe o no está activo
 * 
 * Ejemplo: /api/catalogo/5
 */
router.get("/:id", getDetalleProductoPublico);

export default router;
