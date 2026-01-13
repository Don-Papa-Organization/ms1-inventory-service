import { CategoriaProductoRepository } from "../domain/repositories/categoriaProductoRepository";
import { CategoriaProducto } from "../domain/models/categoriaProducto";
import { CategoriaProductoDto } from "../domain/dtos/categoriaProductoDto";

type ServiceResponse<T> = { status: number; data?: T; message?: string };

export class CategoriaProductoService {
    private readonly repo = new CategoriaProductoRepository();

    private toDto(entity: CategoriaProducto): CategoriaProductoDto {
        return {
            idCategoria: entity.idCategoria,
            nombre: entity.nombre,
        };
    }

    private validatePayload(data: Partial<CategoriaProductoDto>): string | null {
        if (data.nombre === undefined || data.nombre === null || String(data.nombre).trim() === "") {
            return "nombre es obligatorio.";
        }
        if (String(data.nombre).length > 100) {
            return "nombre no debe exceder 100 caracteres.";
        }
        return null;
    }

    async getAll(): Promise<ServiceResponse<{ categorias: CategoriaProductoDto[]; total: number }>> {
        try {
            const categorias = await this.repo.findAll();
            return {
                status: 200,
                data: {
                    categorias: categorias.map(c => this.toDto(c)),
                    total: categorias.length,
                },
            };
        } catch (error: any) {
            console.error("Error al obtener categorías:", error.message);
            return { status: 500, message: "Error interno al obtener categorías." };
        }
    }

    async getById(id: number): Promise<ServiceResponse<CategoriaProductoDto>> {
        try {
            const categoria = await this.repo.findById(id);
            if (!categoria) return { status: 404, message: "Categoría no encontrada." };
            return { status: 200, data: this.toDto(categoria) };
        } catch (error: any) {
            console.error("Error al obtener categoría:", error.message);
            return { status: 500, message: "Error interno al obtener la categoría." };
        }
    }

    async create(payload: CategoriaProductoDto): Promise<ServiceResponse<CategoriaProductoDto>> {
        try {
            const validation = this.validatePayload(payload);
            if (validation) return { status: 400, message: validation };

            const nueva = await this.repo.create({ nombre: payload.nombre } as any);
            return { status: 201, data: this.toDto(nueva) };
        } catch (error: any) {
            console.error("Error al crear categoría:", error.message);
            return { status: 500, message: "Error interno al crear la categoría." };
        }
    }

    async update(id: number, payload: Partial<CategoriaProductoDto>): Promise<ServiceResponse<CategoriaProductoDto>> {
        try {
            const existente = await this.repo.findById(id);
            if (!existente) return { status: 404, message: "Categoría no encontrada." };

            if (payload.nombre !== undefined) {
                const validation = this.validatePayload({ nombre: payload.nombre });
                if (validation) return { status: 400, message: validation };
            }

            const actualizado = await this.repo.update(id, {
                ...(payload.nombre !== undefined && { nombre: payload.nombre }),
            } as any);

            return { status: 200, data: actualizado ? this.toDto(actualizado) : undefined };
        } catch (error: any) {
            console.error("Error al actualizar categoría:", error.message);
            return { status: 500, message: "Error interno al actualizar la categoría." };
        }
    }

    async delete(id: number): Promise<ServiceResponse<null>> {
        try {
            const existente = await this.repo.findById(id);
            if (!existente) return { status: 404, message: "Categoría no encontrada." };

            const result = await this.repo.delete(id);
            if (result === 0) return { status: 404, message: "No se pudo eliminar la categoría." };
            return { status: 200, message: "Categoría eliminada correctamente." };
        } catch (error: any) {
            console.error("Error al eliminar categoría:", error.message);
            return { status: 500, message: "Error interno al eliminar la categoría." };
        }
    }
}

export const categoriaProductoService = new CategoriaProductoService();