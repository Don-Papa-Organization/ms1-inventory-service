import { Request, Response } from "express";
import { productService } from "../services/productService";

/**
 * Obtener catálogo de productos para empleados con filtros
 * CU36 - Visualizar catálogo desde módulo de ventas
 * Permite a empleados ver todos los productos con filtros avanzados
 */
export const getProductos = async (req: Request, res: Response): Promise<any> => {
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

        const result = await productService.getCatalogoEmpleado(filters);
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al obtener catálogo de productos:", error.message);
        return res.status(500).json({ 
            message: "Error interno del servidor al recuperar los datos del catálogo." 
        });
    }
};

/**
 * Obtener un producto por ID
 */
export const getProductoById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "id inválido o no proporcionado." });
        }

        const result = await productService.getById(parseInt(id, 10));
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al obtener producto:", error.message);
        return res.status(500).json({ message: "Error interno al obtener el producto." });
    }
};

/**
 * Crear un nuevo producto
 */
export const createProducto = async (req: Request, res: Response): Promise<any> => {
    try {
        const result = await productService.create(req.body);
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al crear producto:", error.message);
        return res.status(500).json({ message: "Error interno al crear el producto." });
    }
};

/**
 * Actualizar un producto existente
 */
export const updateProducto = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "id inválido o no proporcionado." });
        }

        const result = await productService.update(parseInt(id, 10), req.body);
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al actualizar producto:", error.message);
        return res.status(500).json({ message: "Error interno al actualizar el producto." });
    }
};

/**
 * Eliminar un producto
 */
export const deleteProducto = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "id inválido o no proporcionado." });
        }

        const result = await productService.delete(parseInt(id, 10));
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al eliminar producto:", error.message);
        return res.status(500).json({ message: "Error interno al eliminar el producto." });
    }
};

/**
 * Obtener catálogo público de productos (sin autenticación)
 * CU019 - Acceder al catálogo de productos
 * Permite a cualquier usuario visualizar productos activos con filtros y paginación
 */
export const getCatalogoPublico = async (req: Request, res: Response): Promise<any> => {
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

        const result = await productService.getCatalogo(filters);
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al obtener catálogo público:", error.message);
        return res.status(500).json({ 
            message: "Error al conectar con la base de datos. Por favor, inténtelo más tarde." 
        });
    }
};

/**
 * Obtener detalles públicos de un producto específico (sin autenticación)
 * CU021 - Ver detalles de producto
 * Permite a cualquier usuario visualizar los detalles completos de un producto activo
 */
export const getDetalleProductoPublico = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        // Validar que el ID sea válido
        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "ID de producto inválido." });
        }

        const result = await productService.getDetallePublico(parseInt(id, 10));
        return res.status(result.status).json(result.data ?? { message: result.message });
    } catch (error: any) {
        console.error("Error al obtener detalles del producto:", error.message);
        return res.status(500).json({ 
            message: "Error al conectar con la base de datos. Por favor, inténtelo más tarde." 
        });
    }
};