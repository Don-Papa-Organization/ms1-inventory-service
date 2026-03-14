import { BaseRepository } from "./baseRepository";
import { Producto } from "../models/producto";
import { CategoriaProducto } from "../models/categoriaProducto";
import { FindOptions, Op, WhereOptions } from "sequelize";

export class ProductoRepository extends BaseRepository<Producto> {
    constructor() {
        super(Producto);
    }

    async findByCategoria(idCategoria: number): Promise<Producto[]> {
        return this.model.findAll({ where: { idCategoria } });
    }

    async findByNombre(nombre: string): Promise<Producto[]> {
        return this.model.findAll({
            where: {
                nombre: {
                    [Op.like]: `%${nombre}%`
                }
            }
        });
    }

    async findByActivo(activo: boolean): Promise<Producto[]> {
        return this.model.findAll({ where: { activo } });
    }

    async findAllWithCategoria(filters?: {
        nombre?: string;
        categoria?: number;
        activo?: boolean;
    }): Promise<Producto[]> {
        const where: WhereOptions = {};

        if (filters?.nombre && filters.nombre.trim()) {
            Object.assign(where, {
                nombre: {
                    [Op.like]: `%${filters.nombre.trim()}%`
                }
            });
        }

        if (filters?.categoria !== undefined) {
            Object.assign(where, { idCategoria: filters.categoria });
        }

        if (filters?.activo !== undefined) {
            Object.assign(where, { activo: filters.activo });
        }

        const options: FindOptions = {
            where,
            include: [
                {
                    model: CategoriaProducto,
                    attributes: ["idCategoria", "nombre"],
                    required: false
                }
            ]
        };

        return this.model.findAll(options);
    }
}
