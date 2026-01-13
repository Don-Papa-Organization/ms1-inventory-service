import { BaseRepository } from "./baseRepository";
import { CategoriaProducto } from "../models/categoriaProducto";

export class CategoriaProductoRepository extends BaseRepository<CategoriaProducto> {
    constructor() {
        super(CategoriaProducto);
    }
}
