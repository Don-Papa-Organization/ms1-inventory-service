import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement,
    ForeignKey,
    BelongsTo
} from "sequelize-typescript";
import { CategoriaProducto } from "./categoriaProducto";

@Table({ tableName: "producto", timestamps: false })
export class Producto extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    idProducto!: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    nombre!: string;

    @Column({
        type: DataType.DECIMAL(10, 2),
        allowNull: false
    })
    precio!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 1
    })
    stockActual!: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0
    })
    stockMinimo!: number;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    esPromocion!: boolean;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false
    })
    activo!: boolean;

    @Column({
        type: DataType.STRING(255)
    })
    descripcion?: string;

    @Column({
        type: DataType.TEXT
    })
    urlImagen?: string;

    @ForeignKey(() => CategoriaProducto)
    @Column(DataType.INTEGER)
    idCategoria?: number;

    @BelongsTo(() => CategoriaProducto)
    categoriaProducto?: CategoriaProducto;
}

/*
{
  "nombre": "Producto 123",
  "precio": "45.99",
  "stockActual": 50,
  "stockMinimo": 5,
  "esPromocion": true,
  "activo": true,
  "descripcion": "Descripción de ejemplo",
  "urlImagen": "https://picsum.photos/200?random=123",
  "idCategoria": 1
}
*/