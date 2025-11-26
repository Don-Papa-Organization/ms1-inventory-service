import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    AutoIncrement
} from "sequelize-typescript";

@Table({ tableName: "categoriaProducto", timestamps: false })
export class CategoriaProducto extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    idCategoria!: number;

    @Column({
        type: DataType.STRING(100),
        allowNull: false
    })
    nombre!: string;
}