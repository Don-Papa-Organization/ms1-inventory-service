/**
 * DTO para solicitudes de actualización de productos
 */
export interface UpdateProductoRequestDto {
    nombre?: string;
    precio?: number;
    stockActual?: number;
    stockMinimo?: number;
    activo?: boolean;
    descripcion?: string;
    urlImagen?: string;
    idCategoria?: number;
}
