import { ProductoRepository } from "../domain/repositories/productoRepository";
import { Producto } from "../domain/models/producto";
import { ProductoDto } from "../domain/dtos/productoDto";

type ServiceResponse<T> = { status: number; data?: T; message?: string };

class ProductService {
    constructor(private readonly productRepository = new ProductoRepository()) { }

    private toDto(producto: ProductoDto): ProductoDto {
        return {
            idProducto: producto.idProducto,
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

    private validatePayload(data: Partial<ProductoDto>): string | null {
        const required = ["nombre", "precio", "stockActual", "stockMinimo", "activo"] as const;
        const missing = required.filter(key => data[key] === undefined || data[key] === null);
        if (missing.length) {
            return `Faltan campos obligatorios: ${missing.join(", ")}.`;
        }
        if (data.precio !== undefined && Number(data.precio) < 0) return "precio debe ser mayor o igual a 0.";
        if (data.stockActual !== undefined && data.stockActual < 0) return "stockActual debe ser mayor o igual a 0.";
        if (data.stockMinimo !== undefined && data.stockMinimo < 0) return "stockMinimo debe ser mayor o igual a 0.";
        if (
            data.stockActual !== undefined &&
            data.stockMinimo !== undefined &&
            data.stockActual < data.stockMinimo
        ) {
            return "stockActual no puede ser menor que stockMinimo.";
        }
        return null;
    }

    async getAll(): Promise<ServiceResponse<{ productos: ProductoDto[]; total: number }>> {
        try {
            const productos = await this.productRepository.findAll();
            return {
                status: 200,
                data: {
                    productos: productos.map(p => this.toDto(p)),
                    total: productos.length,
                },
            };
        } catch (error: any) {
            console.error("Error al obtener productos:", error.message);
            return { status: 500, message: "Error interno al obtener productos." };
        }
    }

    async getById(id: number): Promise<ServiceResponse<ProductoDto>> {
        try {
            const producto = await this.productRepository.findById(id);
            if (!producto) return { status: 404, message: "Producto no encontrado." };
            return { status: 200, data: this.toDto(producto) };
        } catch (error: any) {
            console.error("Error al obtener producto:", error.message);
            return { status: 500, message: "Error interno al obtener el producto." };
        }
    }

    async create(payload: ProductoDto): Promise<ServiceResponse<ProductoDto>> {
        try {
            const validation = this.validatePayload(payload);
            if (validation) return { status: 400, message: validation };

            const nuevoProducto = await this.productRepository.create(payload as any);
            return { status: 201, data: this.toDto(nuevoProducto) };
        } catch (error: any) {
            console.error("Error al crear producto:", error.message);
            return { status: 500, message: "Error interno al crear el producto." };
        }
    }

    async update(id: number, payload: Partial<ProductoDto>): Promise<ServiceResponse<ProductoDto>> {
        try {
            const existente = await this.productRepository.findById(id);
            if (!existente) return { status: 404, message: "Producto no encontrado." };

            if (Object.keys(payload).length === 0) {
                return { status: 400, message: "No hay cambios para aplicar." };
            }

            const validation = this.validatePayload({ ...this.toDto(existente), ...payload });
            if (validation) return { status: 400, message: validation };

            const actualizado = await this.productRepository.update(id, payload as any);
            return { status: 200, data: actualizado ? this.toDto(actualizado) : undefined };
        } catch (error: any) {
            console.error("Error al actualizar producto:", error.message);
            return { status: 500, message: "Error interno al actualizar el producto." };
        }
    }

    async delete(id: number): Promise<ServiceResponse<null>> {
        try {
            const existente = await this.productRepository.findById(id);
            if (!existente) return { status: 404, message: "Producto no encontrado." };

            await this.productRepository.delete(id);
            return { status: 200, message: "Producto eliminado correctamente." };
        } catch (error: any) {
            console.error("Error al eliminar producto:", error.message);
            return { status: 500, message: "Error interno al eliminar el producto." };
        }
    }

    async getByCategoria(idCategoria: number): Promise<ServiceResponse<{ productos: ProductoDto[]; total: number }>> {
        try {
            const productos = await this.productRepository.findByCategoria(idCategoria);
            return {
                status: 200,
                data: {
                    productos: productos.map(p => this.toDto(p)),
                    total: productos.length,
                },
            };
        } catch (error: any) {
            console.error("Error al obtener productos por categoría:", error.message);
            return { status: 500, message: "Error interno al obtener productos por categoría." };
        }
    }

    async getByActivo(activo: boolean): Promise<ServiceResponse<{ productos: ProductoDto[]; total: number }>> {
        try {
            const productos = await this.productRepository.findByActivo(activo);
            return {
                status: 200,
                data: {
                    productos: productos.map(p => this.toDto(p)),
                    total: productos.length,
                },
            };
        } catch (error: any) {
            console.error("Error al filtrar productos por estado:", error.message);
            return { status: 500, message: "Error interno al filtrar productos por estado." };
        }
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
    }): Promise<ServiceResponse<{ productos: ProductoDto[]; total: number; pagina: number; totalPaginas: number }>> {
        try {
            // Obtener todos los productos activos
            let productos = await this.productRepository.findByActivo(true);

            // Validar que existan productos
            if (!productos || productos.length === 0) {
                return {
                    status: 200,
                    data: {
                        productos: [],
                        total: 0,
                        pagina: 1,
                        totalPaginas: 0,
                    },
                    message: "No hay productos disponibles actualmente."
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
                status: 200,
                data: {
                    productos: productosPaginados.map(p => this.toDto(p)),
                    total,
                    pagina: page,
                    totalPaginas,
                },
            };
        } catch (error: any) {
            console.error("Error al obtener catálogo de productos:", error.message);
            return { status: 500, message: "Error al conectar con la base de datos. Por favor, inténtelo más tarde." };
        }
    }

    /**
     * Obtener detalles públicos de un producto específico
     * Caso de uso: CU021 - Ver detalles de producto
     * Solo retorna productos activos
     */
    async getDetallePublico(id: number): Promise<ServiceResponse<ProductoDto>> {
        try {
            const producto = await this.productRepository.findById(id);
            
            // Validar que el producto exista
            if (!producto) {
                return { 
                    status: 404, 
                    message: "Este producto ya no está disponible." 
                };
            }

            // Validar que el producto esté activo
            if (!producto.activo) {
                return { 
                    status: 404, 
                    message: "Este producto ya no está disponible." 
                };
            }

            return { status: 200, data: this.toDto(producto) };
        } catch (error: any) {
            console.error("Error al obtener detalles del producto:", error.message);
            return { 
                status: 500, 
                message: "Error al conectar con la base de datos. Por favor, inténtelo más tarde." 
            };
        }
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
        precioMin?: number;
        precioMax?: number;
        page?: number;
        limit?: number;
        ordenarPor?: 'nombre' | 'precio' | 'reciente' | 'stock';
        orden?: 'asc' | 'desc';
    }): Promise<ServiceResponse<{ productos: ProductoDto[]; total: number; pagina: number; totalPaginas: number }>> {
        try {
            // Obtener todos los productos (activos e inactivos)
            let productos = await this.productRepository.findAll();

            // Validar que existan productos
            if (!productos || productos.length === 0) {
                return {
                    status: 200,
                    data: {
                        productos: [],
                        total: 0,
                        pagina: 1,
                        totalPaginas: 0,
                    },
                    message: "No existen productos registrados."
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
                status: 200,
                data: {
                    productos: productosPaginados.map(p => this.toDto(p)),
                    total,
                    pagina: page,
                    totalPaginas,
                },
            };
        } catch (error: any) {
            console.error("Error al obtener catálogo para empleados:", error.message);
            return { 
                status: 500, 
                message: "Error interno del servidor al recuperar los datos del catálogo." 
            };
        }
    }

    /**
     * Actualizar stock de un producto
     * @param id ID del producto
     * @param cantidadCambio Cantidad a sumar o restar (positivo para incrementar, negativo para decrementar)
     * @returns Producto actualizado
     */
    async updateStock(id: number, cantidadCambio: number): Promise<ServiceResponse<ProductoDto>> {
        try {
            // Validar que el producto existe
            const producto = await this.productRepository.findById(id);
            if (!producto) {
                return { status: 404, message: "Producto no encontrado." };
            }

            // Calcular nuevo stock
            const nuevoStock = producto.stockActual + cantidadCambio;

            // Validar que el stock no sea negativo
            if (nuevoStock < 0) {
                return { 
                    status: 400, 
                    message: `Stock insuficiente. Stock actual: ${producto.stockActual}, cantidad solicitada: ${Math.abs(cantidadCambio)}` 
                };
            }

            // Actualizar stock
            const actualizado = await this.productRepository.update(id, { 
                stockActual: nuevoStock 
            } as any);

            if (!actualizado) {
                return { status: 500, message: "Error al actualizar el stock." };
            }

            return { 
                status: 200, 
                data: this.toDto(actualizado),
                message: `Stock actualizado correctamente. Nuevo stock: ${nuevoStock}`
            };
        } catch (error: any) {
            console.error("Error al actualizar stock del producto:", error.message);
            return { status: 500, message: "Error interno al actualizar el stock del producto." };
        }
    }
}

export const productService = new ProductService();
