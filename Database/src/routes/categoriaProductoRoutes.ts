import { Router } from "express";
import { CategoriaProductoController } from "../controllers/categoriaProductoController";

const router = Router();
const categoriaProductoController = new CategoriaProductoController();

router.get('/', categoriaProductoController.getAll.bind(categoriaProductoController));
router.get('/:id', categoriaProductoController.getById.bind(categoriaProductoController));
router.post('/', categoriaProductoController.create.bind(categoriaProductoController));
router.put('/:id', categoriaProductoController.update.bind(categoriaProductoController));
router.delete('/:id', categoriaProductoController.delete.bind(categoriaProductoController));

export default router;
