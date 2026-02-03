import { Request, Response, NextFunction } from 'express';

/**
 * Clase de error personalizada para manejo de errores en la aplicación
 * Permite especificar mensajes y códigos de estado HTTP
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Middleware central de manejo de errores
 * Captura todos los errores y retorna una respuesta HTTP estandarizada
 * 
 * Formato de respuesta:
 * {
 *   success: false,
 *   data: null,
 *   message: string,
 *   timestamp: string (ISO 8601)
 * }
 */
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Error interno del servidor';
  
  console.error(`[ERROR] ${statusCode} - ${message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    timestamp: new Date().toISOString()
  });
};
