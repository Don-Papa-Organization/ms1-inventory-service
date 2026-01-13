import { Router } from "express";
import { getCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria } from "../controllers/categoriaProductoController";
import { authenticateToken, requireUsuarioActivo, requireRoles } from "../middlewares/authMiddleware";
import { TipoUsuario } from "../types/express";

const router = Router();

router.use(authenticateToken, requireUsuarioActivo);

router.get("/", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getCategorias);
router.get("/:id", requireRoles(TipoUsuario.empleado, TipoUsuario.administrador), getCategoriaById);
router.post("/", requireRoles(TipoUsuario.administrador), createCategoria);
router.put("/:id", requireRoles(TipoUsuario.administrador), updateCategoria);
router.delete("/:id", requireRoles(TipoUsuario.administrador), deleteCategoria);

export default router;