import { Request, Response } from "express";
import { categoriaProductoService } from "../services/categoriaProductoService";

export const getCategorias = async (req: Request, res: Response): Promise<any> => {
    try {
        const resp = await categoriaProductoService.getAll();
        return res.status(resp.status).json(resp.data ?? { message: resp.message });
    } catch (error: any) {
        console.error("Error al obtener categorías:", error.message);
        return res.status(500).json({ message: "Error interno al obtener categorías." });
    }
};

export const getCategoriaById = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "id inválido o no proporcionado." });
        }

        const resp = await categoriaProductoService.getById(parseInt(id, 10));
        return res.status(resp.status).json(resp.data ?? { message: resp.message });
    } catch (error: any) {
        console.error("Error al obtener categoría:", error.message);
        return res.status(500).json({ message: "Error interno al obtener la categoría." });
    }
};

export const createCategoria = async (req: Request, res: Response): Promise<any> => {
    try {
        const resp = await categoriaProductoService.create(req.body);
        return res.status(resp.status).json(resp.data ?? { message: resp.message });
    } catch (error: any) {
        console.error("Error al crear categoría:", error.message);
        return res.status(500).json({ message: "Error interno al crear la categoría." });
    }
};

export const updateCategoria = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "id inválido o no proporcionado." });
        }

        const resp = await categoriaProductoService.update(parseInt(id, 10), req.body);
        return res.status(resp.status).json(resp.data ?? { message: resp.message });
    } catch (error: any) {
        console.error("Error al actualizar categoría:", error.message);
        return res.status(500).json({ message: "Error interno al actualizar la categoría." });
    }
};

export const deleteCategoria = async (req: Request, res: Response): Promise<any> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return res.status(400).json({ message: "id inválido o no proporcionado." });
        }

        const resp = await categoriaProductoService.delete(parseInt(id, 10));
        return res.status(resp.status).json(resp.data ?? { message: resp.message });
    } catch (error: any) {
        console.error("Error al eliminar categoría:", error.message);
        return res.status(500).json({ message: "Error interno al eliminar la categoría." });
    }
};