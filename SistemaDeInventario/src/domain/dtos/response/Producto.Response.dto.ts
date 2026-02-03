/**
 * DTO para respuestas de productos
 */
export interface ProductoResponseDto {
    idProducto: number;
    nombre: string;
    precio: number;
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
    descripcion?: string;
    urlImagen?: string;
    idCategoria?: number;
}
