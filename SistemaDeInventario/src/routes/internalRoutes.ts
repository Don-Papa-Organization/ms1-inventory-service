import { Router } from "express";
import { updateStock } from "../controllers/productController";
import { requireInternalToken } from "../middlewares/internalAuthMiddleware";

const router = Router();

/**
 * Ruta interna para servicios (no requiere auth de usuario)
 * Solo accesible con token interno entre microservicios
 */
router.patch("/products/:id/stock", requireInternalToken, updateStock);

export default router;
