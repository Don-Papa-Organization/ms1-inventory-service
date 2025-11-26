import { BaseRepository } from "./baseRepository";
import { CategoriaProducto } from "../models";

export class CategoriaProductoRepository extends BaseRepository<CategoriaProducto>{
    constructor(){
        super(CategoriaProducto)
    }
}