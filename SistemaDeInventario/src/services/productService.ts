import { ProductoRepository } from "../domain/repositories/productoRepository";
import { Producto } from "../domain/models/producto";
import { ProductoDto } from "../domain/dtos/productoDto";
import { ProductoResponseDto } from "../domain/dtos/response/Producto.Response.dto";
import { CreateProductoRequestDto } from "../domain/dtos/request/CreateProducto.Request.dto";
import { UpdateProductoRequestDto } from "../domain/dtos/request/UpdateProducto.Request.dto";
import { AppError } from "../middlewares/error.middleware";
import {
    DEFAULT_PRODUCT_IMAGE_URL,
    buildImageUrl,
    deleteImageByFilename,
    deleteImageIfNotDefault,
    imageFileExistsByUrl,
    isDefaultImageUrl
} from "../utils/imageStorage";

class ProductService {
    constructor(private readonly productRepository = new ProductoRepository()) { }

    private toDto(producto: ProductoDto): ProductoResponseDto {
        return {
            idProducto: producto.idProducto!,
            nombre: producto.nombre,
            precio: Number(producto.precio),
            stockActual: producto.stockActual,
            stockMinimo: producto.stockMinimo,
            activo: producto.activo,
            descripcion: producto.descripcion,
            urlImagen: producto.urlImagen,
            idCategoria: producto.idCategoria,
        };
    }

    private validatePayload(data: Partial<ProductoDto>): void {
        const required = ["nombre", "precio", "stockActual", "stockMinimo", "activo"] as const;
        const missing = required.filter(key => data[key] === undefined || data[key] === null);
        if (missing.length) {
            throw new AppError(`Faltan campos obligatorios: ${missing.join(", ")}.`, 400);
        }
        if (data.precio !== undefined && Number(data.precio) < 0) {
            throw new AppError("precio debe ser mayor o igual a 0.", 400);
        }
        if (data.stockActual !== undefined && data.stockActual < 0) {
            throw new AppError("stockActual debe ser mayor o igual a 0.", 400);
        }
        if (data.stockMinimo !== undefined && data.stockMinimo < 0) {
            throw new AppError("stockMinimo debe ser mayor o igual a 0.", 400);
        }
        if (
            data.stockActual !== undefined &&
            data.stockMinimo !== undefined &&
            data.stockActual < data.stockMinimo
        ) {
            throw new AppError("stockActual no puede ser menor que stockMinimo.", 400);
        }
    }

    async getAll(): Promise<{ productos: ProductoResponseDto[]; total: number }> {
        const productos = await this.productRepository.findAll();
        return {
            productos: productos.map(p => this.toDto(p)),
            total: productos.length,
        };
    }

    async getById(id: number): Promise<ProductoResponseDto> {
        const producto = await this.productRepository.findById(id);
        if (!producto) {
            throw new AppError("Producto no encontrado.", 404);
        }
        return this.toDto(producto);
    }

    async create(payload: CreateProductoRequestDto): Promise<ProductoResponseDto> {
        this.validatePayload(payload);
        const payloadWithDefault = {
            ...payload,
            urlImagen: payload.urlImagen || DEFAULT_PRODUCT_IMAGE_URL
        };
        const nuevoProducto = await this.productRepository.create(payloadWithDefault as any);
        return this.toDto(nuevoProducto);
    }

    async update(id: number, payload: UpdateProductoRequestDto): Promise<ProductoResponseDto> {
        const existente = await this.productRepository.findById(id);
        if (!existente) {
            throw new AppError("Producto no encontrado.", 404);
        }

        if (payload.urlImagen !== undefined) {
            const urlImagen = (payload.urlImagen || "").trim();

            if (!urlImagen) {
                payload.urlImagen = existente.urlImagen;
            } else {
                const existe = await imageFileExistsByUrl(urlImagen);
                if (!existe) {
                    payload.urlImagen = existente.urlImagen;
                }
            }
        }

        if (Object.keys(payload).length === 0) {
            throw new AppError("No hay cambios para aplicar.", 400);
        }

        this.validatePayload({ ...this.toDto(existente), ...payload });
        const actualizado = await this.productRepository.update(id, payload as any);
        if (!actualizado) {
            throw new AppError("Error al actualizar el producto.", 500);
        }
        return this.toDto(actualizado);
    }

    async delete(id: number): Promise<void> {
        const existente = await this.productRepository.findById(id);
        if (!existente) {
            throw new AppError("Producto no encontrado.", 404);
        }
        await this.productRepository.delete(id);
        await deleteImageIfNotDefault(existente.urlImagen);
    }

    async getByCategoria(idCategoria: number): Promise<{ productos: ProductoResponseDto[]; total: number }> {
        const productos = await this.productRepository.findByCategoria(idCategoria);
        return {
            productos: productos.map(p => this.toDto(p)),
            total: productos.length,
        };
    }

    async getByActivo(activo: boolean): Promise<{ productos: ProductoResponseDto[]; total: number }> {
        const productos = await this.productRepository.findByActivo(activo);
        return {
            productos: productos.map(p => this.toDto(p)),
            total: productos.length,
        };
    }


    /**
     * Obtener catálogo público de productos activos con filtros y paginación
     * Caso de uso: CU019 - Acceder al catálogo de productos
     */
    async getCatalogo(filters: {
        categoria?: number;
        precioMin?: number;
        precioMax?: number;
        page?: number;
        limit?: number;
        ordenarPor?: 'nombre' | 'precio' | 'reciente';
        orden?: 'asc' | 'desc';
    }): Promise<{ productos: ProductoResponseDto[]; total: number; pagina: number; totalPaginas: number }> {
        // Obtener todos los productos activos
        let productos = await this.productRepository.findByActivo(true);

        // Validar que existan productos
        if (!productos || productos.length === 0) {
            return {
                productos: [],
                total: 0,
                pagina: 1,
                totalPaginas: 0,
            };
        }

        // Aplicar filtro por categoría
        if (filters.categoria !== undefined) {
            productos = productos.filter(p => p.idCategoria === filters.categoria);
        }

        // Aplicar filtro por precio mínimo
        if (filters.precioMin !== undefined && filters.precioMin >= 0) {
            productos = productos.filter(p => Number(p.precio) >= filters.precioMin!);
        }

        // Aplicar filtro por precio máximo
        if (filters.precioMax !== undefined && filters.precioMax >= 0) {
            productos = productos.filter(p => Number(p.precio) <= filters.precioMax!);
        }

        // Ordenar productos
        const ordenarPor = filters.ordenarPor || 'nombre';
        const orden = filters.orden || 'asc';

        productos.sort((a, b) => {
            let valorA: any;
            let valorB: any;

            switch (ordenarPor) {
                case 'precio':
                    valorA = Number(a.precio);
                    valorB = Number(b.precio);
                    break;
                case 'reciente':
                    valorA = a.idProducto || 0;
                    valorB = b.idProducto || 0;
                    break;
                case 'nombre':
                default:
                    valorA = a.nombre.toLowerCase();
                    valorB = b.nombre.toLowerCase();
                    break;
            }

            if (orden === 'desc') {
                return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
            } else {
                return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
            }
        });

        // Paginación
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
        const total = productos.length;
        const totalPaginas = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const productosPaginados = productos.slice(startIndex, endIndex);

        return {
            productos: productosPaginados.map(p => this.toDto(p)),
            total,
            pagina: page,
            totalPaginas,
        };
    }

    /**
     * Obtener detalles públicos de un producto específico
     * Caso de uso: CU021 - Ver detalles de producto
     * Solo retorna productos activos
     */
    async getDetallePublico(id: number): Promise<ProductoResponseDto> {
        const producto = await this.productRepository.findById(id);
        
        // Validar que el producto exista
        if (!producto) {
            throw new AppError("Este producto ya no está disponible.", 404);
        }

        // Validar que el producto esté activo
        if (!producto.activo) {
            throw new AppError("Este producto ya no está disponible.", 404);
        }

        return this.toDto(producto);
    }

    /**
     * Obtener catálogo para empleados con filtros avanzados y paginación
     * Caso de uso: CU36 - Visualizar catálogo desde módulo de ventas
     * Permite a empleados ver todos los productos con filtros completos
     */
    async getCatalogoEmpleado(filters: {
        nombre?: string;
        categoria?: number;
        activo?: boolean;
        esPromocion?: boolean;
        precioMin?: number;
        precioMax?: number;
        page?: number;
        limit?: number;
        ordenarPor?: 'nombre' | 'precio' | 'reciente' | 'stock';
        orden?: 'asc' | 'desc';
    }): Promise<{ productos: ProductoResponseDto[]; total: number; pagina: number; totalPaginas: number }> {
        // Obtener todos los productos (activos e inactivos)
        let productos = await this.productRepository.findAll();

        // Validar que existan productos
        if (!productos || productos.length === 0) {
            return {
                productos: [],
                total: 0,
                pagina: 1,
                totalPaginas: 0,
            };
        }

        // Aplicar filtro por nombre (búsqueda parcial case-insensitive)
        if (filters.nombre !== undefined && filters.nombre.trim() !== '') {
            const nombreBusqueda = filters.nombre.toLowerCase();
            productos = productos.filter(p => 
                p.nombre.toLowerCase().includes(nombreBusqueda)
            );
        }

        // Aplicar filtro por categoría
        if (filters.categoria !== undefined) {
            productos = productos.filter(p => p.idCategoria === filters.categoria);
        }

        // Aplicar filtro por estado (activo/inactivo)
        if (filters.activo !== undefined) {
            productos = productos.filter(p => p.activo === filters.activo);
        }

        // Aplicar filtro por precio mínimo
        if (filters.precioMin !== undefined && filters.precioMin >= 0) {
            productos = productos.filter(p => Number(p.precio) >= filters.precioMin!);
        }

        // Aplicar filtro por precio máximo
        if (filters.precioMax !== undefined && filters.precioMax >= 0) {
            productos = productos.filter(p => Number(p.precio) <= filters.precioMax!);
        }

        // Ordenar productos
        const ordenarPor = filters.ordenarPor || 'nombre';
        const orden = filters.orden || 'asc';

        productos.sort((a, b) => {
            let valorA: any;
            let valorB: any;

            switch (ordenarPor) {
                case 'precio':
                    valorA = Number(a.precio);
                    valorB = Number(b.precio);
                    break;
                case 'stock':
                    valorA = a.stockActual;
                    valorB = b.stockActual;
                    break;
                case 'reciente':
                    valorA = a.idProducto || 0;
                    valorB = b.idProducto || 0;
                    break;
                case 'nombre':
                default:
                    valorA = a.nombre.toLowerCase();
                    valorB = b.nombre.toLowerCase();
                    break;
            }

            if (orden === 'desc') {
                return valorA > valorB ? -1 : valorA < valorB ? 1 : 0;
            } else {
                return valorA < valorB ? -1 : valorA > valorB ? 1 : 0;
            }
        });

        // Paginación
        const page = filters.page && filters.page > 0 ? filters.page : 1;
        const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;
        const total = productos.length;
        const totalPaginas = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        const productosPaginados = productos.slice(startIndex, endIndex);

        return {
            productos: productosPaginados.map(p => this.toDto(p)),
            total,
            pagina: page,
            totalPaginas,
        };
    }

    /**
     * Actualizar stock de un producto
     * @param id ID del producto
     * @param cantidadCambio Cantidad a sumar o restar (positivo para incrementar, negativo para decrementar)
     * @returns Producto actualizado
     */
    async updateStock(id: number, cantidadCambio: number): Promise<ProductoResponseDto> {
        // Validar que el producto existe
        const producto = await this.productRepository.findById(id);
        if (!producto) {
            throw new AppError("Producto no encontrado.", 404);
        }

        // Calcular nuevo stock
        const nuevoStock = producto.stockActual + cantidadCambio;

        // Validar que el stock no sea negativo
        if (nuevoStock < 0) {
            throw new AppError(
                `Stock insuficiente. Stock actual: ${producto.stockActual}, cantidad solicitada: ${Math.abs(cantidadCambio)}`,
                400
            );
        }

        // Actualizar stock
        const actualizado = await this.productRepository.update(id, { 
            stockActual: nuevoStock 
        } as any);

        if (!actualizado) {
            throw new AppError("Error al actualizar el stock.", 500);
        }

        return this.toDto(actualizado);
    }

    /**
     * Actualizar imagen de un producto existente
     * @param id ID del producto
     * @param filename Nombre de archivo guardado
     */
    async updateImage(id: number, filename: string): Promise<ProductoResponseDto> {
        const existente = await this.productRepository.findById(id);
        if (!existente) {
            await deleteImageByFilename(filename);
            throw new AppError("Producto no encontrado.", 404);
        }

        const nuevaUrl = buildImageUrl(filename);

        const actualizado = await this.productRepository.update(id, {
            urlImagen: nuevaUrl
        } as any);

        if (!actualizado) {
            await deleteImageByFilename(filename);
            throw new AppError("Error al actualizar la imagen del producto.", 500);
        }

        if (!isDefaultImageUrl(existente.urlImagen) && existente.urlImagen !== nuevaUrl) {
            await deleteImageIfNotDefault(existente.urlImagen);
        }

        return this.toDto(actualizado);
    }
}

export const productService = new ProductService();
