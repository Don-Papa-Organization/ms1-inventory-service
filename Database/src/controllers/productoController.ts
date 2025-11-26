import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { Producto } from '../models';
import { ProductoRepository } from '../repositories/productoRepository';

export class ProductoController extends BaseController<Producto> {
    private productoRepository: ProductoRepository;

    constructor() {
        const productoRepo = new ProductoRepository();
        super(productoRepo);
        this.productoRepository = productoRepo;
    }

    async getByCategoria(req: Request, res: Response): Promise<void> {
        try {
            const idCategoria = this.validateId(req.params.idCategoria);
            
            if (!idCategoria) {
                res.status(400).json({
                    success: false,
                    error: 'ID de categoría inválido'
                });
                return;
            }

            const productos = await this.productoRepository.findByCategoria(idCategoria);
            
            productos.length > 0
                ? res.json({ success: true, data: productos })
                : res.status(404).json({
                    success: false,
                    error: 'No se encontraron productos en esta categoría'
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar productos por categoría');
        }
    }

    async getByActivo(req: Request, res: Response): Promise<void> {
        try {
            const { activo } = req.body;
            
            if (typeof activo !== 'boolean') {
                res.status(400).json({
                    success: false,
                    error: 'El parámetro activo debe ser un valor booleano'
                });
                return;
            }

            const productos = await this.productoRepository.findByActivo(activo);
            
            productos.length > 0
                ? res.json({ success: true, data: productos })
                : res.status(404).json({
                    success: false,
                    error: `No se encontraron productos ${activo ? 'activos' : 'inactivos'}`
                });
        } catch (error) {
            this.handleError(error, res, 'Error al buscar productos por estado');
        }
    }
}