import { Producto } from "../domain/models";
import { imageScraperService } from "../utils/imageScraperService";
import { imageFileExistsByUrl, DEFAULT_PRODUCT_IMAGE_URL, isDefaultImageUrl } from "../utils/imageStorage";

/**
 * Función para buscar y asignar imágenes a productos existentes dela seed
 * Ejecutable como tarea asíncrona sin bloquear el servidor
 */
export async function assignImagesToSeedProducts(limit: number = 50): Promise<void> {
  try {
    console.log("[ImageAssigner] Iniciando asignación de imágenes a productos...");

    // Obtener productos sin imagen o con imagen por defecto, ordenados por ID ascendente
    const productosSinImagen = await Producto.findAll({
      where: {
        [require("sequelize").Op.or]: [
          { urlImagen: null },
          { urlImagen: "" },
          { urlImagen: DEFAULT_PRODUCT_IMAGE_URL },
        ],
      },
      order: [["idProducto", "ASC"]],
      limit,
    });

    if (productosSinImagen.length === 0) {
      console.log("[ImageAssigner] No hay productos sin imágenes");
      return;
    }

    console.log(
      `[ImageAssigner] Encontrados ${productosSinImagen.length} productos sin imágenes`
    );

    let asignadas = 0;
    let fallidas = 0;

    for (const producto of productosSinImagen) {
      try {
        const result = await imageScraperService.scrapeAndSaveProductImage(
          producto.nombre,
          producto.idProducto
        );

        if (result.success && result.localUrl) {
          await producto.update({ urlImagen: result.localUrl });
          asignadas++;
          console.log(
            `[ImageAssigner] ✅ ${producto.nombre} → ${result.localUrl}`
          );
        } else {
          fallidas++;
          const reason = result.error || "No se obtuvo URL local válida";
          console.warn(
            `[ImageAssigner] ❌ ${producto.nombre}: ${reason}`
          );
        }

        // Pequeño delay entre scrapes para no saturar servidores
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        fallidas++;
        console.error(
          `[ImageAssigner] Error procesando ${producto.nombre}:`,
          error
        );
      }
    }

    console.log(
      `[ImageAssigner] Completado: ${asignadas} asignadas, ${fallidas} fallidas`
    );
  } catch (error) {
    console.error("[ImageAssigner] Error general:", error);
  }
}

/**
 * Función para verificar y reasignar imágenes a productos que ya tienen URL pero el archivo no existe
 * Procesa todos los productos (max 300) ordenados por ID ascendente
 */
export async function verifyAndAssignImagesToAllProducts(limit: number = 300): Promise<void> {
  try {
    console.log("[ImageAssigner] Iniciando verificación y asignación de imágenes a todos los productos...");

    // Obtener todos los productos ordenados por ID ascendente
    const todosProductos = await Producto.findAll({
      order: [["idProducto", "ASC"]],
      limit,
    });

    if (todosProductos.length === 0) {
      console.log("[ImageAssigner] No hay productos en la base de datos");
      return;
    }

    console.log(
      `[ImageAssigner] Procesando ${todosProductos.length} productos...`
    );

    let asignadas = 0;
    let verificadas = 0;
    let fallidas = 0;

    for (const producto of todosProductos) {
      try {
        const tieneImagenValida = 
          producto.urlImagen && 
          !isDefaultImageUrl(producto.urlImagen) &&
          await imageFileExistsByUrl(producto.urlImagen);

        if (!tieneImagenValida) {
          // Si no tiene imagen o el archivo no existe, scrapear nueva imagen
          const result = await imageScraperService.scrapeAndSaveProductImage(
            producto.nombre,
            producto.idProducto
          );

          if (result.success && result.localUrl) {
            await producto.update({ urlImagen: result.localUrl });
            asignadas++;
            console.log(
              `[ImageAssigner] ✅ ${producto.nombre} → ${result.localUrl}`
            );
          } else {
            fallidas++;
            const reason = result.error || "No se obtuvo URL local válida";
            console.warn(
              `[ImageAssigner] ❌ ${producto.nombre}: ${reason}`
            );
          }
        } else {
          verificadas++;
          console.log(
            `[ImageAssigner] ✓ ${producto.nombre}: imagen existente válida`
          );
        }

        // Pequeño delay entre scrapes para no saturar servidores
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        fallidas++;
        console.error(
          `[ImageAssigner] Error procesando ${producto.nombre}:`,
          error
        );
      }
    }

    console.log(
      `[ImageAssigner] Completado: ${asignadas} asignadas, ${verificadas} verificadas, ${fallidas} fallidas`
    );
  } catch (error) {
    console.error("[ImageAssigner] Error general:", error);
  }
}

/**
 * Asignar imagen a un producto específico (para crear productos nuevos)
 */
export async function assignImageToProduct(
  idProducto: number
): Promise<string | null> {
  try {
    const producto = await Producto.findByPk(idProducto);
    if (!producto) {
      console.warn(`[ImageAssigner] Producto ${idProducto} no encontrado`);
      return null;
    }

    console.log(
      `[ImageAssigner] Buscando imagen para nuevo producto: ${producto.nombre}`
    );

    const result = await imageScraperService.scrapeAndSaveProductImage(
      producto.nombre,
      idProducto
    );

    if (result.success && result.localUrl) {
      await producto.update({ urlImagen: result.localUrl });
      console.log(
        `[ImageAssigner] ✅ Imagen asignada: ${producto.nombre} → ${result.localUrl}`
      );
      return result.localUrl;
    } else {
      const reason = result.error || "No se obtuvo URL local válida";
      console.warn(`[ImageAssigner] ❌ No se pudo asignar imagen: ${reason}`);
      return null;
    }
  } catch (error) {
    console.error(`[ImageAssigner] Error asignando imagen: ${error}`);
    return null;
  }
}
