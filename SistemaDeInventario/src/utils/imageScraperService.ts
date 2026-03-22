import https from "https";
import http from "http";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { IMAGES_DIR, buildImageUrl } from "./imageStorage";

interface ScraperResult {
  success: boolean;
  imageUrl: string | null;
  localUrl: string | null;
  error?: string;
}

/**
 * Servicio de scraping de imágenes para productos
 * Busca imágenes sin fondo de productos usando estrategias sin APIs de pago
 */
export class ImageScraperService {
  private readonly timeout = 10000; // 10 segundos
  private readonly maxRetries = 3;

  /**
   * Buscar y descargar imagen para un producto
   * Estrategia: DuckDuckGo (sin JS) + Bing (fallback)
   */
  async scrapeAndSaveProductImage(
    productName: string,
    idProducto: number
  ): Promise<ScraperResult> {
    try {
      // Limpiar nombre para búsqueda
      const searchTerm = this.sanitizeSearchTerm(productName);

      if (!searchTerm) {
        return {
          success: false,
          imageUrl: null,
          localUrl: null,
          error: "Nombre de producto vacío o inválido",
        };
      }

      console.log(
        `[ImageScraper] Buscando imagen para: "${productName}" (ID: ${idProducto})`
      );

      const searchVariants = this.buildSearchVariants(searchTerm);

      // Intentar múltiples estrategias sobre variantes del término
      let imageUrl: string | null = null;
      for (const variant of searchVariants) {
        imageUrl = await this.scrapeFromDuckDuckGo(variant);
        if (!imageUrl) {
          imageUrl = await this.scrapeFromBingImages(variant);
        }
        if (imageUrl) {
          break;
        }
      }

      if (!imageUrl) {
        for (const variant of searchVariants) {
          imageUrl = await this.scrapFromWikimedia(variant);
          if (imageUrl) {
            break;
          }
        }
      }

      if (!imageUrl) {
        return {
          success: false,
          imageUrl: null,
          localUrl: null,
          error: "No se encontraron imágenes disponibles",
        };
      }

      // Descargar y guardar imagen localmente
      const localUrl = await this.downloadAndSaveImage(imageUrl, idProducto);

      if (!localUrl) {
        return {
          success: false,
          imageUrl,
          localUrl: null,
          error: "No se pudo descargar o validar la imagen encontrada",
        };
      }

      return {
        success: true,
        imageUrl,
        localUrl,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[ImageScraper] Error scraping product: ${message}`);
      return {
        success: false,
        imageUrl: null,
        localUrl: null,
        error: message,
      };
    }
  }

  /**
   * Scraper para DuckDuckGo (más amigable sin JS)
   * Busca URLs de imagen directamente desde search results
   */
  private async scrapeFromDuckDuckGo(searchTerm: string): Promise<string | null> {
    try {
      const encodedTerm = encodeURIComponent(`${searchTerm} product image`);
      const url = `https://duckduckgo.com/?q=${encodedTerm}&iax=images&ia=images`;

      const imageUrl = await this.extractImageFromHtml(url);
      if (imageUrl) {
        console.log(`[ImageScraper] Imagen encontrada en DuckDuckGo: ${imageUrl}`);
      }
      return imageUrl;
    } catch (error) {
      console.warn(`[ImageScraper] Error en DuckDuckGo: ${error}`);
      return null;
    }
  }

  /**
   * Scraper para Bing Images (fallback)
   */
  private async scrapeFromBingImages(searchTerm: string): Promise<string | null> {
    try {
      const encodedTerm = encodeURIComponent(searchTerm);
      const url = `https://www.bing.com/images/search?q=${encodedTerm}&first=0&count=15`;

      const html = await this.fetchPage(url);
      const imageUrl = this.extractImageFromBingHtml(html) || this.extractImageFromRawHtml(html);
      if (imageUrl) {
        console.log(`[ImageScraper] Imagen encontrada en Bing: ${imageUrl}`);
      }
      return imageUrl;
    } catch (error) {
      console.warn(`[ImageScraper] Error en Bing: ${error}`);
      return null;
    }
  }

  /**
   * Scraper para Wikimedia Commons (imágenes libres con buen formato)
   */
  private async scrapFromWikimedia(searchTerm: string): Promise<string | null> {
    try {
      const encodedTerm = encodeURIComponent(searchTerm);
      const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodedTerm}&srnamespace=6&srlimit=10&format=json`;

      const html = await this.fetchPage(url);
      const data = JSON.parse(html);

      if (data.query?.search && data.query.search.length > 0) {
        // Obtener URL de miniatura del primer resultado
        const title = data.query.search[0].title;
        const fileUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`;
        const imageUrl = await this.extractImageFromWikimedia(fileUrl);

        if (imageUrl) {
          console.log(`[ImageScraper] Imagen encontrada en Wikimedia: ${imageUrl}`);
          return imageUrl;
        }
      }
      return null;
    } catch (error) {
      console.warn(`[ImageScraper] Error en Wikimedia: ${error}`);
      return null;
    }
  }

  /**
   * Extraer URL de imagen desde HTML
   */
  private async extractImageFromHtml(
    pageUrl: string
  ): Promise<string | null> {
    try {
      const html = await this.fetchPage(pageUrl);

      return this.extractImageFromRawHtml(html);
    } catch (error) {
      console.warn(`[ImageScraper] Error extrayendo imagen: ${error}`);
      return null;
    }
  }

  /**
   * Extraer URL de imagen desde contenido HTML ya descargado
   */
  private extractImageFromRawHtml(html: string): string | null {
    try {

      // Expresiones regulares para encontrar URLs de imagen
      const patterns = [
        /src=["']([^"']*\.(?:jpg|jpeg|png|webp)[^"']*?)["']/gi,
        /data-src=["']([^"']*\.(?:jpg|jpeg|png|webp)[^"']*?)["']/gi,
        /url\(["']?([^"'()]*\.(?:jpg|jpeg|png|webp)[^"'()]*?)["']?\)/gi,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const urlCandidate = match[1];

          // Filtrar URLs válidas
          if (
            this.isValidImageUrl(urlCandidate) &&
            !this.isTrackerOrBadUrl(urlCandidate)
          ) {
            const normalized = this.normalizeImageUrl(urlCandidate);
            if (normalized) {
              return normalized;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.warn(`[ImageScraper] Error extrayendo imagen: ${error}`);
      return null;
    }
  }

  /**
   * Bing incluye URLs de imágenes en metadatos JSON embebidos (murl).
   * Este extractor evita tomar assets relativos del sitio (por ejemplo /rp/...png).
   */
  private extractImageFromBingHtml(html: string): string | null {
    const patterns = [
      /"murl":"(https?:\\\/\\\/[^"\\]+(?:\\.[^"\\]+)*)"/gi,
      /murl&quot;:&quot;(https?:\/\/[^&"']+)&quot;/gi,
      /"imgurl":"(https?:\\\/\\\/[^"\\]+(?:\\.[^"\\]+)*)"/gi,
    ];

    for (const pattern of patterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(html)) !== null) {
        const rawUrl = match[1];
        const decoded = this.decodeEscapedUrl(rawUrl);
        if (this.isValidImageUrl(decoded) && !this.isTrackerOrBadUrl(decoded)) {
          const normalized = this.normalizeImageUrl(decoded);
          if (normalized) {
            return normalized;
          }
        }
      }
    }

    return null;
  }

  private decodeEscapedUrl(rawUrl: string): string {
    return rawUrl
      .replace(/\\u002f/gi, "/")
      .replace(/\\\//g, "/")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, "\"")
      .trim();
  }

  private buildSearchVariants(searchTerm: string): string[] {
    const base = searchTerm
      .replace(/\b(x|xs?)\b/gi, " ")
      .replace(/\b\d+\s*(ml|l|lt|lts)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const variants = [
      searchTerm,
      `${searchTerm} licor botella`,
      base,
      base ? `${base} licor botella` : "",
      base ? `${base} product image` : "",
    ]
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    return Array.from(new Set(variants));
  }

  /**
   * Extraer imagen desde página de Wikimedia
   */
  private async extractImageFromWikimedia(fileUrl: string): Promise<string | null> {
    try {
      const html = await this.fetchPage(fileUrl);

      // Buscar la URL de la imagen en escala grande
      const match = html.match(
        /href="(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/[^"]*\.(?:jpg|jpeg|png)[^"]*?)"/i
      );

      if (match?.[1]) {
        return match[1];
      }

      return null;
    } catch (error) {
      console.warn(`[ImageScraper] Error extrayendo de Wikimedia: ${error}`);
      return null;
    }
  }

  /**
   * Descargar y guardar imagen localmente
   */
  private async downloadAndSaveImage(
    imageUrl: string,
    idProducto: number
  ): Promise<string | null> {
    try {
      // Generar nombre de archivo único
      const extension = this.getImageExtension(imageUrl);
      const filename = `product_${idProducto}_${Date.now()}.${extension}`;
      const filePath = path.join(IMAGES_DIR, filename);

      // Asegurar que el directorio existe
      await fs.mkdir(IMAGES_DIR, { recursive: true });

      // Descargar imagen con reintentos
      const buffer = await this.downloadImageWithRetry(imageUrl, this.maxRetries);

      if (!buffer) {
        return null;
      }

      // Validar que sea imagen válida (revisar magic bytes)
      if (!this.isValidImageFile(buffer)) {
        console.warn(
          `[ImageScraper] Archivo descargado no es imagen válida: ${filename}`
        );
        return null;
      }

      // Guardar archivo
      await fs.writeFile(filePath, buffer);

      const localUrl = buildImageUrl(filename);
      console.log(
        `[ImageScraper] ✅ Imagen guardada: ${filename} → ${localUrl}`
      );

      return localUrl;
    } catch (error) {
      console.error(`[ImageScraper] Error descargando imagen: ${error}`);
      return null;
    }
  }

  /**
   * Descargar imagen con reintentos y timeout
   */
  private async downloadImageWithRetry(
    imageUrl: string,
    retriesLeft: number
  ): Promise<Buffer | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn(`[ImageScraper] Timeout descargando: ${imageUrl}`);
        resolve(null);
      }, this.timeout);

      const protocol = imageUrl.startsWith("https") ? https : http;

      try {
        protocol
          .get(
            imageUrl,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
              timeout: this.timeout,
            },
            (response) => {
              // Redireccionamiento
              if (
                response.statusCode === 301 ||
                response.statusCode === 302 ||
                response.statusCode === 307
              ) {
                clearTimeout(timeout);
                const redirectUrl = response.headers.location;
                if (redirectUrl && retriesLeft > 0) {
                  this.downloadImageWithRetry(redirectUrl, retriesLeft - 1).then(
                    resolve
                  );
                } else {
                  resolve(null);
                }
                return;
              }

              // Error HTTP
              if (!response.statusCode || response.statusCode >= 400) {
                clearTimeout(timeout);
                resolve(null);
                return;
              }

              const chunks: Buffer[] = [];
              response.on("data", (chunk: Buffer) => chunks.push(chunk));
              response.on("end", () => {
                clearTimeout(timeout);
                resolve(Buffer.concat(chunks));
              });
              response.on("error", () => {
                clearTimeout(timeout);
                resolve(null);
              });
            }
          )
          .on("error", () => {
            clearTimeout(timeout);
            resolve(null);
          });
      } catch (error) {
        clearTimeout(timeout);
        resolve(null);
      }
    });
  }

  /**
   * Validar que el archivo sea una imagen válida (magic bytes)
   */
  private isValidImageFile(buffer: Buffer): boolean {
    if (buffer.length < 4) return false;

    // Magic bytes para formatos de imagen comunes
    const magicBytes = [
      { bytes: [0xff, 0xd8, 0xff], format: "JPEG" },
      { bytes: [0x89, 0x50, 0x4e], format: "PNG" },
      { bytes: [0x47, 0x49, 0x46], format: "GIF" },
      { bytes: [0x52, 0x49, 0x46], format: "WEBP" },
    ];

    for (const { bytes } of magicBytes) {
      if (bytes.every((byte, idx) => buffer[idx] === byte)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Obtener extensión de URL de imagen
   */
  private getImageExtension(url: string): string {
    const match = url.match(/\.(\w+)(?:\?|#|$)/);
    if (match?.[1]) {
      const ext = match[1].toLowerCase();
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        return ext;
      }
    }
    return "jpg"; // Default
  }

  /**
   * Normalizar URL de imagen (agregar protocolo si falta)
   */
  private normalizeImageUrl(url: string): string | null {
    if (url.startsWith("http")) return url;
    if (url.startsWith("//")) return `https:${url}`;
    if (url.startsWith("/")) return null;
    return `https://${url}`;
  }

  /**
   * Validar URL de imagen
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== "string") return false;

    // Solo aceptar URLs absolutas o protocol-relative; rechazar rutas relativas como /rp/...
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("//")) {
      return false;
    }

    const lower = url.toLowerCase();
    if (!lower.includes(".jpg") && !lower.includes(".jpeg") &&
        !lower.includes(".png") && !lower.includes(".gif") &&
        !lower.includes(".webp")) {
      return false;
    }

    // Rechazar URLs muy cortas o largas
    if (url.length < 10 || url.length > 500) return false;

    return true;
  }

  /**
   * Detectar URLs de tracker, CDN de baja calidad o no válidas
   */
  private isTrackerOrBadUrl(url: string): boolean {
    const badPatterns = [
      "tracking",
      "doubleclick",
      "analytics",
      "pixel",
      "beacon",
      "ads",
      "banner",
      "1x1",
      "transparent",
      "spacer",
    ];

    const lower = url.toLowerCase();
    return badPatterns.some((pattern) => lower.includes(pattern));
  }

  /**
   * Saneador de términos de búsqueda
   */
  private sanitizeSearchTerm(term: string): string {
    return term
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, " ")
      .substring(0, 50); // Limitar a 50 caracteres
  }

  /**
   * Obtener página web (simple fetch sin dependencias extras)
   */
  private fetchPage(pageUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout fetching: ${pageUrl}`));
      }, this.timeout);

      const protocol = pageUrl.startsWith("https") ? https : http;

      try {
        protocol
          .get(
            pageUrl,
            {
              headers: {
                "User-Agent":
                  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
              timeout: this.timeout,
            },
            (response) => {
              let data = "";

              response.on("data", (chunk) => {
                data += chunk;
              });

              response.on("end", () => {
                clearTimeout(timeout);
                resolve(data);
              });

              response.on("error", (error) => {
                clearTimeout(timeout);
                reject(error);
              });
            }
          )
          .on("error", (error) => {
            clearTimeout(timeout);
            reject(error);
          });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}

export const imageScraperService = new ImageScraperService();
