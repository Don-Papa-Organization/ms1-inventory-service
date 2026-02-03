/**
 * Tipos globales para respuestas HTTP estandarizadas
 */

/**
 * Estructura estándar para todas las respuestas HTTP de la API
 * @template T - Tipo de datos que se retornan en el campo 'data'
 * 
 * @example
 * const response: ApiResponse<ProductoDto> = {
 *   success: true,
 *   data: { idProducto: 1, nombre: "Producto" },
 *   message: "Producto obtenido exitosamente",
 *   timestamp: new Date().toISOString()
 * };
 */
export type ApiResponse<T = any> = {
  success: boolean;      // true si la operación fue exitosa, false si hubo error
  data: T | null;        // los datos reales (si success=true) o null (si success=false)
  message: string;       // mensaje descriptivo para el usuario
  timestamp: string;     // fecha y hora de la respuesta en formato ISO 8601
};
