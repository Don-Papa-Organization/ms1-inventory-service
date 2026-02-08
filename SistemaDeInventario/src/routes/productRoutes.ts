import { Router } from "express";
import { getProductos, getProductoById, createProducto, updateProducto, deleteProducto, updateStock, uploadProductoImagen } from "../controllers/productController"
import { authenticateToken, requireUsuarioActivo, requireRoles } from "../middlewares/authMiddleware";
import { TipoUsuario } from "../types/express";
import { productImageUpload } from "../middlewares/productImageUpload";

const router = Router();

router.use(authenticateToken, requireUsuarioActivo);

router.get("/", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getProductos);
router.get("/:id", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getProductoById);
router.post("/", requireRoles(TipoUsuario.administrador), createProducto);
router.post("/:id/imagen", requireRoles(TipoUsuario.administrador), productImageUpload.single("imagen"), uploadProductoImagen);
router.put("/:id", requireRoles(TipoUsuario.administrador), updateProducto);
router.patch("/:id/stock", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), updateStock);
router.delete("/:id", requireRoles(TipoUsuario.administrador), deleteProducto);

export default router;