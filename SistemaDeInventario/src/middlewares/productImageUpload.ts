import multer from "multer";
import { Request } from "express";
import path from "path";
import crypto from "crypto";
import { AppError } from "./error.middleware";
import { IMAGES_DIR, ensureImagesDir } from "../utils/imageStorage";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

const storage = multer.diskStorage({
    destination: async (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, destination: string) => void
    ) => {
        try {
            await ensureImagesDir();
            cb(null, IMAGES_DIR);
        } catch (error) {
            cb(error as Error, IMAGES_DIR);
        }
    },
    filename: (
        req: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, filename: string) => void
    ) => {
        const ext = getExtensionFromMime(file.mimetype) || path.extname(file.originalname) || ".img";
        const id = req.params?.id ? `producto-${req.params.id}` : "producto";
        const unique = `${Date.now()}-${crypto.randomUUID()}`;
        cb(null, `${id}-${unique}${ext}`);
    }
});

const fileFilter: multer.Options["fileFilter"] = (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new AppError("Tipo de archivo no permitido. Solo imágenes JPEG, PNG, WEBP o SVG.", 400));
    }
    cb(null, true);
};

export const productImageUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES }
});

function getExtensionFromMime(mime: string): string | null {
    switch (mime) {
        case "image/jpeg":
            return ".jpg";
        case "image/png":
            return ".png";
        case "image/webp":
            return ".webp";
        case "image/svg+xml":
            return ".svg";
        default:
            return null;
    }
}
