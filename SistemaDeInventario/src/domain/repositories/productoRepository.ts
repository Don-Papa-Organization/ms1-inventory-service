import { BaseRepository } from "./baseRepository";
import { Producto } from "../models/producto";

export class ProductoRepository extends BaseRepository<Producto> {
    constructor() {
        super(Producto);
    }

    async findByCategoria(idCategoria: number): Promise<Producto[]> {
        return this.model.findAll({ where: { idCategoria } });
    }

    async findByActivo(activo: boolean): Promise<Producto[]> {
        return this.model.findAll({ where: { activo } });
    }
}
