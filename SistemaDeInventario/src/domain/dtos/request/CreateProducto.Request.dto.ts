/**
 * DTO para solicitudes de creación de productos
 */
export interface CreateProductoRequestDto {
    nombre: string;
    precio: number;
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
    descripcion?: string;
    urlImagen?: string;
    idCategoria?: number;
}
