import { CategoriaProductoRepository } from "../domain/repositories/categoriaProductoRepository";
import { CategoriaProducto } from "../domain/models/categoriaProducto";
import { CategoriaResponseDto } from "../domain/dtos/response/Categoria.Response.dto";
import { CreateCategoriaRequestDto } from "../domain/dtos/request/CreateCategoria.Request.dto";
import { UpdateCategoriaRequestDto } from "../domain/dtos/request/UpdateCategoria.Request.dto";
import { AppError } from "../middlewares/error.middleware";

export class CategoriaProductoService {
    private readonly repo = new CategoriaProductoRepository();

    private toDto(entity: CategoriaProducto): CategoriaResponseDto {
        return {
            idCategoria: entity.idCategoria!,
            nombre: entity.nombre,
        };
    }

    private validatePayload(data: Partial<CategoriaResponseDto>): void {
        if (data.nombre === undefined || data.nombre === null || String(data.nombre).trim() === "") {
            throw new AppError("nombre es obligatorio.", 400);
        }
        if (String(data.nombre).length > 100) {
            throw new AppError("nombre no debe exceder 100 caracteres.", 400);
        }
    }

    async getAll(): Promise<{ categorias: CategoriaResponseDto[]; total: number }> {
        const categorias = await this.repo.findAll();
        return {
            categorias: categorias.map(c => this.toDto(c)),
            total: categorias.length,
        };
    }

    async getById(id: number): Promise<CategoriaResponseDto> {
        const categoria = await this.repo.findById(id);
        if (!categoria) {
            throw new AppError("Categoría no encontrada.", 404);
        }
        return this.toDto(categoria);
    }

    async create(payload: CreateCategoriaRequestDto): Promise<CategoriaResponseDto> {
        this.validatePayload(payload);
        const nueva = await this.repo.create({ nombre: payload.nombre } as any);
        return this.toDto(nueva);
    }

    async update(id: number, payload: UpdateCategoriaRequestDto): Promise<CategoriaResponseDto> {
        const existente = await this.repo.findById(id);
        if (!existente) {
            throw new AppError("Categoría no encontrada.", 404);
        }

        if (payload.nombre !== undefined) {
            this.validatePayload({ nombre: payload.nombre });
        }

        const actualizado = await this.repo.update(id, {
            ...(payload.nombre !== undefined && { nombre: payload.nombre }),
        } as any);

        if (!actualizado) {
            throw new AppError("Error al actualizar la categoría.", 500);
        }

        return this.toDto(actualizado);
    }

    async delete(id: number): Promise<void> {
        const existente = await this.repo.findById(id);
        if (!existente) {
            throw new AppError("Categoría no encontrada.", 404);
        }

        const result = await this.repo.delete(id);
        if (result === 0) {
            throw new AppError("No se pudo eliminar la categoría.", 500);
        }
    }
}

export const categoriaProductoService = new CategoriaProductoService();