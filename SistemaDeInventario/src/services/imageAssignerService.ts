import { Producto } from "../domain/models";
import { imageScraperService } from "../utils/imageScraperService";

/**
 * Función para buscar y asignar imágenes a productos existentes dela seed
 * Ejecutable como tarea asíncrona sin bloquear el servidor
 */
export async function assignImagesToSeedProducts(): Promise<void> {
  try {
    console.log("[ImageAssigner] Iniciando asignación de imágenes a productos...");

    // Obtener productos sin imagen o con imagen por defecto
    const productossSinImagen = await Producto.findAll({
      where: {
        [require("sequelize").Op.or]: [
          { urlImagen: null },
          { urlImagen: "" },
          { urlImagen: "/images/default-product.svg" },
        ],
      },
      limit: 50, // Limitar a 50 por ejecución para no sobrecargar
    });

    if (productossSinImagen.length === 0) {
      console.log("[ImageAssigner] No hay productos sin imágenes");
      return;
    }

    console.log(
      `[ImageAssigner] Encontrados ${productossSinImagen.length} productos sin imágenes`
    );

    let asignadas = 0;
    let fallidas = 0;

    for (const producto of productossSinImagen) {
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
