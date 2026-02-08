import path from "path";
import fs from "fs/promises";

export const IMAGE_PUBLIC_BASE = "/images";
export const DEFAULT_PRODUCT_IMAGE_FILENAME = "default-product.svg";
export const DEFAULT_PRODUCT_IMAGE_URL = `${IMAGE_PUBLIC_BASE}/${DEFAULT_PRODUCT_IMAGE_FILENAME}`;

export const IMAGES_DIR = path.resolve(__dirname, "..", "images");

export const buildImageUrl = (filename: string): string => `${IMAGE_PUBLIC_BASE}/${filename}`;

export const isDefaultImageUrl = (url?: string | null): boolean => {
    if (!url) return false;
    return url.endsWith(`/${DEFAULT_PRODUCT_IMAGE_FILENAME}`) || url === DEFAULT_PRODUCT_IMAGE_URL;
};

export const ensureImagesDir = async (): Promise<void> => {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
};

export const deleteImageIfNotDefault = async (url?: string | null): Promise<void> => {
    if (!url || isDefaultImageUrl(url)) return;
    if (!url.startsWith(IMAGE_PUBLIC_BASE)) return;

    const filename = path.basename(url);
    const filePath = path.join(IMAGES_DIR, filename);

    try {
        await fs.unlink(filePath);
    } catch {
        // Ignorar errores si el archivo no existe
    }
};

export const imageFileExistsByUrl = async (url?: string | null): Promise<boolean> => {
    if (!url) return false;
    if (!url.startsWith(IMAGE_PUBLIC_BASE)) return true;

    const filename = path.basename(url);
    const filePath = path.join(IMAGES_DIR, filename);

    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

export const deleteImageByFilename = async (filename: string): Promise<void> => {
    if (!filename || filename === DEFAULT_PRODUCT_IMAGE_FILENAME) return;
    const filePath = path.join(IMAGES_DIR, filename);
    try {
        await fs.unlink(filePath);
    } catch {
        // Ignorar errores si el archivo no existe
    }
};
