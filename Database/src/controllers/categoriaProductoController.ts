import { Request, Response } from 'express';
import { BaseController } from './baseController';
import { CategoriaProducto } from '../models';
import { CategoriaProductoRepository } from '../repositories/categoriaProductoRepository';

export class CategoriaProductoController extends BaseController<CategoriaProducto> {
    private categoriaProductoRepository: CategoriaProductoRepository;

    constructor() {
        const categoriaProductoRepo = new CategoriaProductoRepository();
        super(categoriaProductoRepo);
        this.categoriaProductoRepository = categoriaProductoRepo;
    }
}