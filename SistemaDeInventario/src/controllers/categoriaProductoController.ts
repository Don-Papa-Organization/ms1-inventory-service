import { Request, Response, NextFunction } from "express";
import { categoriaProductoService } from "../services/categoriaProductoService";
import { ApiResponse } from "../types";

export const getCategorias = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await categoriaProductoService.getAll();
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Categorías obtenidas exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

export const getCategoriaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de categoría inválido o no proporcionado."));
        }

        const data = await categoriaProductoService.getById(parseInt(id, 10));
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Categoría obtenida exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

export const createCategoria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = await categoriaProductoService.create(req.body);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Categoría creada exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(201).json(response);
    } catch (error: any) {
        next(error);
    }
};

export const updateCategoria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de categoría inválido o no proporcionado."));
        }

        const data = await categoriaProductoService.update(parseInt(id, 10), req.body);
        
        const response: ApiResponse = {
            success: true,
            data,
            message: 'Categoría actualizada exitosamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};

export const deleteCategoria = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(parseInt(id, 10))) {
            return next(new Error("ID de categoría inválido o no proporcionado."));
        }

        await categoriaProductoService.delete(parseInt(id, 10));
        
        const response: ApiResponse = {
            success: true,
            data: null,
            message: 'Categoría eliminada correctamente',
            timestamp: new Date().toISOString()
        };
        
        res.status(200).json(response);
    } catch (error: any) {
        next(error);
    }
};