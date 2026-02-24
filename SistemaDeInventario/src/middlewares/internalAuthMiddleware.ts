import { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";

/**
 * Middleware para autenticación interna entre microservicios
 * Usa el header x-internal-token y la variable de entorno INTERNAL_SERVICE_TOKEN
 */
export const requireInternalToken = (req: Request, res: Response, next: NextFunction) => {
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN || "variablegenerica";
  const providedToken = req.headers["x-internal-token"] as string | undefined;

  if (!expectedToken) {
    return next(new AppError("INTERNAL_SERVICE_TOKEN no configurado", 500));
  }

  if (!providedToken || providedToken !== expectedToken) {
    return next(new AppError("Token interno inválido", 401));
  }

  return next();
};