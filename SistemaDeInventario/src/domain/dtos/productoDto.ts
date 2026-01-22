export interface ProductoDto {
    idProducto?: number;
    nombre: string;
    precio: number;
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
    descripcion?: string;
    urlImagen?: string;
    idCategoria?: number;
}
