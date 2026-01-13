import { Router } from "express";
import { getProductos, getProductoById, createProducto, updateProducto, deleteProducto } from "../controllers/productController"
import { authenticateToken, requireUsuarioActivo, requireRoles } from "../middlewares/authMiddleware";
import { TipoUsuario } from "../types/express";

const router = Router();

router.use(authenticateToken, requireUsuarioActivo);

router.get("/", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getProductos);
router.get("/:id", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getProductoById);
router.post("/", requireRoles(TipoUsuario.administrador), createProducto);
router.put("/:id", requireRoles(TipoUsuario.administrador), updateProducto);
router.delete("/:id", requireRoles(TipoUsuario.administrador), deleteProducto);

export default router;