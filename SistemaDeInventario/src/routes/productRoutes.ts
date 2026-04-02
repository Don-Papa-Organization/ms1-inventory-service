import { Router } from "express";
import {
	getProductos,
	getProductoById,
	createProducto,
	updateProducto,
	deleteProducto,
	updateStock,
	uploadProductoImagen,
	asociarProductoCategoria,
	searchProductosByNombre,
	getProductosByCategoria,
	getProductosEnriquecidos,
	scrapeAndAssignImageToProduct,
	scrapeAndAssignImagesBulk,
	scrapeAndAssignImagesToAllProducts
} from "../controllers/productController"
import { authenticateToken, requireUsuarioActivo, requireRoles } from "../middlewares/authMiddleware";
import { requireInternalToken } from "../middlewares/internalAuthMiddleware";
import { TipoUsuario } from "../types/express";
import { productImageUpload } from "../middlewares/productImageUpload";

const router = Router();

router.use(authenticateToken, requireUsuarioActivo);

router.get("/", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getProductos);
router.get("/search", requireRoles(TipoUsuario.cliente, TipoUsuario.empleado, TipoUsuario.administrador), searchProductosByNombre);
router.get("/categoria/:idCategoria", requireRoles(TipoUsuario.cliente, TipoUsuario.empleado, TipoUsuario.administrador), getProductosByCategoria);
router.get("/enriched", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getProductosEnriquecidos);
router.get("/:id", requireRoles(TipoUsuario.cliente, TipoUsuario.empleado, TipoUsuario.administrador), getProductoById);
router.post("/", requireRoles(TipoUsuario.administrador), createProducto);

// Admin endpoints para scraping de imágenes
router.post("/admin/scrape-image/:id", requireRoles(TipoUsuario.administrador), scrapeAndAssignImageToProduct);
router.post("/admin/scrape-images-bulk", requireRoles(TipoUsuario.administrador), scrapeAndAssignImagesBulk);
router.post("/admin/scrape-images-all", requireRoles(TipoUsuario.administrador), scrapeAndAssignImagesToAllProducts);

router.post("/:id/imagen", requireRoles(TipoUsuario.administrador), productImageUpload.single("imagen"), uploadProductoImagen);
router.put("/:id/categoria/:idCategoria", requireRoles(TipoUsuario.administrador), asociarProductoCategoria);
router.put("/:id", requireRoles(TipoUsuario.administrador), updateProducto);
router.patch("/:id/stock", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), updateStock);
router.delete("/:id", requireRoles(TipoUsuario.administrador), deleteProducto);

export default router;