import express, { Express } from "express";
import {
	productoRoutes,
	categoriaProductoRoutes,
} from './routes';

const app: Express = express();

app.use(express.json());


app.use('/db/productos', productoRoutes);
app.use('/db/categorias-producto', categoriaProductoRoutes);

export default app;