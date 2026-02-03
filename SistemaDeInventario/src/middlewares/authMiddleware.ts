import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwtUtil";
import { TipoUsuario } from "../types/express";
import { AppError } from "./error.middleware";

function extractToken(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/accessToken=([^;]+)/);
    if (match?.[1]) return match[1];
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.replace("Bearer ", "").trim();
  }

  return null;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): any => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AppError("No se proporcionó access token", 401);
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      throw new AppError("Token inválido o expirado", 401);
    }

    req.user = payload;
    return next();
  } catch (error) {
    next(error);
  }
};

export const requireUsuarioActivo = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("No autenticado", 401));
  }
  if (!req.user.activo) {
    return next(new AppError("Usuario no activo", 403));
  }
  return next();
};

export const requireRoles = (...rolesPermitidos: TipoUsuario[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError("No autenticado", 401));
  }
  if (!req.user.activo) {
    return next(new AppError("Usuario no activo", 403));
  }
  if (!rolesPermitidos.includes(req.user.tipoUsuario)) {
    return next(new AppError("No tiene permisos para esta operación", 403));
  }
  return next();
};