import { Request, Response, NextFunction } from "express";
import { productService } from "../services/productService";
import { ApiResponse } from "../types";

/**
 * Obtener catálogo de productos para empleados con filtros
 * CU36 - Visualizar catálogo desde módulo de ventas
 * Permite a empleados ver todos los productos con filtros avanzados
 */
export const getProductos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Parsear query params
        const {
            nombre,
            categoria,
            activo,
            esPromocion,
            precioMin,
            precioMax,
            page,
            limit,
            ordenarPor,
            orden
        } = req.query;

        // Construir filtros
        const filters: any = {};

        if (nombre) {
            filters.nombre = nombre as string;
        }

        if (categoria) {
            const categoriaNum = parseInt(categoria as string, 10);
            if (!isNaN(categoriaNum)) {
                filters.categoria = categoriaNum;
            }
        }

        if (activo !== undefined) {
            filters.activo = activo === 'true' || activo === '1';
        }

        if (esPromocion !== undefined) {
            filters.esPromocion = esPromocion === 'true' || esPromocion === '1';
        }

        if (precioMin) {
            const precioMinNum = parseFloat(precioMin as string);
            if (!isNaN(precioMinNum) && precioMinNum >= 0) {
                filters.precioMin = precioMinNum;
            }
        }

        if (precioMax) {
            const precioMaxNum = parseFloat(precioMax as string);
            if (!isNaN(precioMaxNum) && precioMaxNum >= 0) {
                filters.precioMax = precioMaxNum;
            }
        }

        if (page) {
            const pageNum = parseInt(page as string, 10);
            if (!isNaN(pageNum) && pageNum > 0) {
                filters.page = pageNum;
            }
        }

        if (limit) {
            const limitNum = parseInt(limit as string, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                filters.limit = limitNum;
            }
        }

        if (ordenarPor && ['nombre', 'precio', 'reciente', 'stock'].includes(ordenarPor as string)) {
            filters.ordenarPor = ordenarPor as 'nombre' | 'precio' | 'reciente' | 'stock';
        }

        if (orden && ['asc', 'desc'].includes(orden as string)) {
            filters.orden = orden as 'asc' | 'desc';
        }

        const data = await productService.getCatalogoEmpleado(filters);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Catálogo de productos obtenido exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener un producto por ID
 */
export const getProductoById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de producto inválido o no proporcionado."));
        }

        const data = await productService.getById(parseInt(id, 10));
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Producto obtenido exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Crear un nuevo producto
 */
export const createProducto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await productService.create(req.body);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Producto creado exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(201).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Actualizar un producto existente
 */
export const updateProducto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de producto inválido o no proporcionado."));
        }

        const data = await productService.update(parseInt(id, 10), req.body);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Producto actualizado exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Eliminar un producto
 */
export const deleteProducto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de producto inválido o no proporcionado."));
        }

        await productService.delete(parseInt(id, 10));
        
        const response: ApiResponse = {
            success: true,
            data: null,
            message: 'Producto eliminado correctamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener catálogo público de productos (sin autenticación)
 * CU019 - Acceder al catálogo de productos
 * Permite a cualquier usuario visualizar productos activos con filtros y paginación
 */
export const getCatalogoPublico = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Parsear query params
        const {
            categoria,
            precioMin,
            precioMax,
            esPromocion,
            page,
            limit,
            ordenarPor,
            orden
        } = req.query;

        // Construir filtros
        const filters: any = {};

        if (categoria) {
            const categoriaNum = parseInt(categoria as string, 10);
            if (!isNaN(categoriaNum)) {
                filters.categoria = categoriaNum;
            }
        }

        if (precioMin) {
            const precioMinNum = parseFloat(precioMin as string);
            if (!isNaN(precioMinNum) && precioMinNum >= 0) {
                filters.precioMin = precioMinNum;
            }
        }

        if (precioMax) {
            const precioMaxNum = parseFloat(precioMax as string);
            if (!isNaN(precioMaxNum) && precioMaxNum >= 0) {
                filters.precioMax = precioMaxNum;
            }
        }

        if (esPromocion !== undefined) {
            filters.esPromocion = esPromocion === 'true' || esPromocion === '1';
        }

        if (page) {
            const pageNum = parseInt(page as string, 10);
            if (!isNaN(pageNum) && pageNum > 0) {
                filters.page = pageNum;
            }
        }

        if (limit) {
            const limitNum = parseInt(limit as string, 10);
            if (!isNaN(limitNum) && limitNum > 0) {
                filters.limit = limitNum;
            }
        }

        if (ordenarPor && ['nombre', 'precio', 'reciente'].includes(ordenarPor as string)) {
            filters.ordenarPor = ordenarPor as 'nombre' | 'precio' | 'reciente';
        }

        if (orden && ['asc', 'desc'].includes(orden as string)) {
            filters.orden = orden as 'asc' | 'desc';
        }

        const data = await productService.getCatalogo(filters);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: data.productos.length > 0 ? 'Catálogo obtenido exitosamente' : 'No hay productos disponibles actualmente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener detalles públicos de un producto específico (sin autenticación)
 * CU021 - Ver detalles de producto
 * Permite a cualquier usuario visualizar los detalles completos de un producto activo
 */
export const getDetalleProductoPublico = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        // Validar que el ID sea válido
        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de producto inválido."));
        }

        const data = await productService.getDetallePublico(parseInt(id, 10));
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Detalles del producto obtenidos exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Actualizar stock de un producto
 * Permite incrementar o decrementar el stock
 */
export const updateStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        const { cantidadCambio } = req.body;

        // Validar ID
        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de producto inválido."));
        }

        // Validar cantidadCambio
        if (cantidadCambio === undefined || cantidadCambio === null || isNaN(cantidadCambio)) {
            return next(new Error("El campo 'cantidadCambio' es requerido y debe ser un número."));
        }

        const data = await productService.updateStock(parseInt(id, 10), cantidadCambio);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Stock actualizado correctamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};