import { Router } from "express";
import { ProductoController } from "../controllers/productoController";

const router = Router();
const productoController = new ProductoController();

router.get('/categoria/:idCategoria', productoController.getByCategoria.bind(productoController));
router.get('/activo/:activo', productoController.getByActivo.bind(productoController));
router.get('/', productoController.getAll.bind(productoController));
router.get('/:id', productoController.getById.bind(productoController));
router.post('/', productoController.create.bind(productoController));
router.put('/:id', productoController.update.bind(productoController));
router.delete('/:id', productoController.delete.bind(productoController));

export default router;
