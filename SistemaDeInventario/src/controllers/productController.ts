import { Request, Response, NextFunction } from "express";
import { productService } from "../services/productService";
import { categoriaProductoService } from "../services/categoriaProductoService";
import { AppError } from "../middlewares/error.middleware";
import { promotionService } from "../services/apis/promotionService";
import { assignImageToProduct, assignImagesToSeedProducts, verifyAndAssignImagesToAllProducts } from "../services/imageAssignerService";
import { ApiResponse } from "../types";
import path from "path";
import { DEFAULT_PRODUCT_IMAGE_URL, IMAGE_PUBLIC_BASE, IMAGES_DIR } from "../utils/imageStorage";

interface CatalogPromotionView {
    idPromocion: number | null;
    nombrePromocion: string | null;
    precioOriginal: number;
    precioPromocional: number | null;
    porcentajeDescuento: number | null;
    tienePromocion: boolean;
}

const parseNumber = (value: unknown): number | null => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const resolvePromotionProductId = (promotion: any): number | null => {
    return (
        parseNumber(promotion?.productId) ??
        parseNumber(promotion?.idProducto) ??
        parseNumber(promotion?.productoId) ??
        parseNumber(promotion?.id_producto)
    );
};

const buildPromotionView = (promotion: any, precioBase: number): CatalogPromotionView => {
    if (!promotion) {
        return {
            idPromocion: null,
            nombrePromocion: null,
            precioOriginal: precioBase,
            precioPromocional: null,
            porcentajeDescuento: null,
            tienePromocion: false,
        };
    }

    const rawPromoPrice =
        parseNumber(promotion?.precioPromocional) ??
        parseNumber(promotion?.precio_promocional);

    const rawDiscount =
        parseNumber(promotion?.porcentajeDescuento) ??
        parseNumber(promotion?.porcentaje_descuento);

    let precioPromocional: number | null = null;
    let porcentajeDescuento: number | null = null;

    if (rawPromoPrice !== null && rawPromoPrice > 0 && rawPromoPrice < precioBase) {
        precioPromocional = rawPromoPrice;
        const calculatedDiscount = Math.round(((precioBase - rawPromoPrice) / precioBase) * 100);
        porcentajeDescuento = rawDiscount !== null && rawDiscount > 0 ? rawDiscount : calculatedDiscount;
    } else if (rawDiscount !== null && rawDiscount > 0) {
        const calculatedPrice = Math.max(0, Math.round(precioBase - (precioBase * rawDiscount) / 100));
        if (calculatedPrice < precioBase) {
            precioPromocional = calculatedPrice;
            porcentajeDescuento = rawDiscount;
        }
    }

    return {
        idPromocion:
            parseNumber(promotion?.idPromocion) ??
            parseNumber(promotion?.promotionId) ??
            parseNumber(promotion?.id_promocion),
        nombrePromocion:
            promotion?.nombrePromocion ??
            promotion?.promotionName ??
            promotion?.nombre_promocion ??
            null,
        precioOriginal: precioBase,
        precioPromocional,
        porcentajeDescuento,
        tienePromocion: precioPromocional !== null,
    };
};

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

        // Enriquecer producto con promociones si existen
        const authHeader = req.headers.authorization;
        const accessToken = authHeader ? authHeader.split(' ')[1] : undefined;
        const activePromos = await promotionService.getActiveProductosPromocion(accessToken);
        const promoMap = new Map(activePromos.map((p: any) => [p.productId, p]));

        const enrichedProductos = data.productos.map((prod: any) => {
            const promo = promoMap.get(prod.idProducto);
            if (promo) {
                return { ...prod, promotion: promo };
            }
            return prod;
        });

        const enrichedData = { ...data, productos: enrichedProductos };

        const response: ApiResponse = {
            success: true,
            data: enrichedData,
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

        // Iniciar búsqueda de imagen en background sin bloquear respuesta
        if (data?.idProducto) {
          assignImageToProduct(data.idProducto).catch((error) =>
            console.error(`[ProductController] Error asignando imagen para producto ${data.idProducto}:`, error)
          );
        }

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
 * Asociar un producto con una categoría por ID
 */
export const asociarProductoCategoria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id, idCategoria } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new AppError("ID de producto inválido.", 400));
        }

        if (!idCategoria || isNaN(parseInt(idCategoria, 10))) {
            return next(new AppError("ID de categoría inválido.", 400));
        }

        const idProductoNum = parseInt(id, 10);
        const idCategoriaNum = parseInt(idCategoria, 10);

        await categoriaProductoService.getById(idCategoriaNum);

        const data = await productService.update(idProductoNum, { idCategoria: idCategoriaNum });

        const response: ApiResponse = {
            success: true,
            data,
            message: "Producto asociado a categoría correctamente",
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

        // Enriquecer producto público con promociones si existen
        const activePromos = await promotionService.getActiveProductosPromocion();
        const promoMap = new Map(activePromos.map((p: any) => [p.productId, p]));

        const enrichedProductos = data.productos.map((prod: any) => {
            const promo = promoMap.get(prod.idProducto);
            if (promo) {
                return { ...prod, promotion: promo };
            }
            return prod;
        });

        const enrichedData = { ...data, productos: enrichedProductos };

        const response: ApiResponse = {
            success: true,
            data: enrichedData,
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

/**
 * Subir imagen para un producto específico
 * Flujo separado del proceso de creación
 */
export const uploadProductoImagen = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new AppError("ID de producto inválido.", 400));
        }

        if (!req.file) {
            return next(new AppError("No se recibió ninguna imagen.", 400));
        }

        const data = await productService.updateImage(parseInt(id, 10), req.file.filename);

        const response: ApiResponse = {
            success: true,
            data,
            message: "Imagen de producto actualizada correctamente",
            timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener imagen pública de un producto
 * Devuelve el archivo si es imagen local o redirecciona si es URL externa
 */
export const getProductoImagenPublica = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new AppError("ID de producto inválido.", 400));
        }

        const producto = await productService.getById(parseInt(id, 10));
        const urlImagen = (producto.urlImagen || DEFAULT_PRODUCT_IMAGE_URL).trim();

        if (urlImagen.startsWith("http://") || urlImagen.startsWith("https://")) {
            res.redirect(urlImagen);
            return;
        }

        if (urlImagen.startsWith(IMAGE_PUBLIC_BASE)) {
            const filename = path.basename(urlImagen);
            const filePath = path.join(IMAGES_DIR, filename);
            res.sendFile(filePath);
            return;
        }

        const host = req.get("host");
        const baseUrl = host ? `${req.protocol}://${host}` : "";
        res.redirect(`${baseUrl}${urlImagen}`);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Buscar productos por nombre con paginacion.
 */
export const searchProductosByNombre = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { nombre, page, limit } = req.query;

        if (!nombre || String(nombre).trim().length === 0) {
            return next(new AppError("El parametro 'nombre' es obligatorio.", 400));
        }

        const pageNum = page ? parseInt(page as string, 10) : undefined;
        const limitNum = limit ? parseInt(limit as string, 10) : undefined;

        const data = await productService.searchByNombre(String(nombre).trim(), pageNum, limitNum);

        const response: ApiResponse = {
            success: true,
            data,
            message: 'Búsqueda de productos completada',
            timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener productos por categoria con paginacion.
 */
export const getProductosByCategoria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { idCategoria } = req.params;
        const { page, limit } = req.query;

        if (!idCategoria || isNaN(parseInt(idCategoria, 10))) {
            return next(new AppError("ID de categoría inválido.", 400));
        }

        const pageNum = page ? parseInt(page as string, 10) : undefined;
        const limitNum = limit ? parseInt(limit as string, 10) : undefined;

        const data = await productService.getByCategoriaPaginado(parseInt(idCategoria, 10), pageNum, limitNum);

        const response: ApiResponse = {
            success: true,
            data,
            message: 'Productos por categoría obtenidos exitosamente',
            timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener productos enriquecidos con información de categoría en una sola consulta.
 */
export const getProductosEnriquecidos = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { nombre, categoria, activo, page, limit } = req.query;

        const filters: {
            nombre?: string;
            categoria?: number;
            activo?: boolean;
            page?: number;
            limit?: number;
        } = {};

        if (nombre && String(nombre).trim().length > 0) {
            filters.nombre = String(nombre).trim();
        }

        if (categoria && !isNaN(parseInt(categoria as string, 10))) {
            filters.categoria = parseInt(categoria as string, 10);
        }

        if (activo !== undefined) {
            filters.activo = activo === 'true' || activo === '1';
        }

        if (page && !isNaN(parseInt(page as string, 10))) {
            filters.page = parseInt(page as string, 10);
        }

        if (limit && !isNaN(parseInt(limit as string, 10))) {
            filters.limit = parseInt(limit as string, 10);
        }

        const data = await productService.getProductosEnriquecidos(filters);

        const response: ApiResponse = {
            success: true,
            data,
            message: 'Productos enriquecidos obtenidos exitosamente',
            timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

/**
 * [ADMIN] Buscar y asignar imagen a un producto específico
 * POST /api/products/admin/scrape-image/:id
 * Dispara búsqueda web y descarga de imagen para un producto
 */
export const scrapeAndAssignImageToProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new AppError("ID de producto inválido.", 400));
        }

        const idProducto = parseInt(id, 10);

        // Validar que el producto existe
        const producto = await productService.getById(idProducto);
        if (!producto) {
            return next(new AppError("Producto no encontrado.", 404));
        }

        // Disparar asignación en background pero responder inmediatamente
        assignImageToProduct(idProducto).catch(error => {
            console.error(`[IMAGE-SCRAPER] Error asignando imagen a producto ${idProducto}:`, error);
        });

        const response: ApiResponse = {
            success: true,
            data: {
                idProducto,
                mensaje: "Búsqueda de imagen iniciada en background"
            },
            message: "Proceso de scraping de imagen iniciado exitosamente",
            timestamp: new Date().toISOString()
        };

        res.status(202).json(response); // 202 Accepted
    } catch (error: any) {
        next(error);
    }
};

/**
 * [ADMIN] Buscar y asignar imágenes a TODOS los productos sin imagen
 * POST /api/products/admin/scrape-images-bulk
 * Dispara búsqueda masiva de imágenes para productos que aún no las tienen
 */
export const scrapeAndAssignImagesBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Disparar bulk assignment en background pero responder inmediatamente
        assignImagesToSeedProducts(50).catch(error => {
            console.error("[IMAGE-SCRAPER] Error en scraping masivo de imágenes:", error);
        });

        const response: ApiResponse = {
            success: true,
            data: {
                mensaje: "Búsqueda masiva de imágenes iniciada en background",
                procesamiento: "La asignación de imágenes se ejecutará en segundo plano"
            },
            message: "Proceso masivo de scraping de imágenes iniciado exitosamente",
            timestamp: new Date().toISOString()
        };

        res.status(202).json(response); // 202 Accepted
    } catch (error: any) {
        next(error);
    }
};

/**
 * [ADMIN] Verificar y asignar imágenes a TODOS los productos (max 300)
 * POST /api/products/admin/scrape-images-all
 * Verifica si cada producto tiene imagen válida, si no la tiene la scrappea
 * Procesa todos los productos ordenados por ID ascendente
 */
export const scrapeAndAssignImagesToAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const limit = 300;
        
        // Disparar bulk assignment en background pero responder inmediatamente
        verifyAndAssignImagesToAllProducts(limit).catch(error => {
            console.error("[IMAGE-SCRAPER] Error en scraping de todos los productos:", error);
        });

        const response: ApiResponse = {
            success: true,
            data: {
                mensaje: "Verificación y asignación de imágenes a todos los productos iniciada en background",
                procesamiento: "Se procesarán todos los productos (máx 300) verificando si tienen imagen válida",
                limite: limit
            },
            message: "Proceso de scraping para todos los productos iniciado exitosamente",
            timestamp: new Date().toISOString()
        };

        res.status(202).json(response); // 202 Accepted
    } catch (error: any) {
        next(error);
    }
};

/**
 * Obtener catálogo público enriquecido con precio promocional ya calculado.
 * Objetivo: reducir latencia y evitar llamadas N+1 del cliente a promociones.
 */
export const getCatalogoPublicoEnriquecido = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
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

        if (!data.productos.length) {
            const response: ApiResponse = {
                success: true,
                data: {
                    ...data,
                    productos: []
                },
                message: 'No hay productos disponibles actualmente',
                timestamp: new Date().toISOString()
            };

            res.status(200).json(response);
            return;
        }

        const activePromos = await promotionService.getActiveProductosPromocion();
        const promoMap = new Map<number, any>();

        for (const promo of activePromos) {
            const productId = resolvePromotionProductId(promo);
            if (productId !== null && !promoMap.has(productId)) {
                promoMap.set(productId, promo);
            }
        }

        let productosEnriquecidos = data.productos.map((producto: any) => {
            const promotion = promoMap.get(producto.idProducto) ?? null;
            const promotionView = buildPromotionView(promotion, Number(producto.precio));

            return {
                ...producto,
                promotion,
                precioOriginal: promotionView.precioOriginal,
                precioPromocional: promotionView.precioPromocional,
                porcentajeDescuento: promotionView.porcentajeDescuento,
                tienePromocion: promotionView.tienePromocion,
                promotionSummary: {
                    idPromocion: promotionView.idPromocion,
                    nombrePromocion: promotionView.nombrePromocion,
                    precioPromocional: promotionView.precioPromocional,
                    porcentajeDescuento: promotionView.porcentajeDescuento,
                    tienePromocion: promotionView.tienePromocion,
                }
            };
        });

        if (esPromocion !== undefined) {
            const onlyPromotions = esPromocion === 'true' || esPromocion === '1';
            productosEnriquecidos = productosEnriquecidos.filter((producto: any) => {
                return onlyPromotions ? producto.tienePromocion : !producto.tienePromocion;
            });
        }

        const response: ApiResponse = {
            success: true,
            data: {
                ...data,
                total: productosEnriquecidos.length,
                productos: productosEnriquecidos,
            },
            message: productosEnriquecidos.length > 0
                ? 'Catálogo enriquecido obtenido exitosamente'
                : 'No hay productos disponibles con los filtros solicitados',
            timestamp: new Date().toISOString()
        };

        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};