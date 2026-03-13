import axios, { AxiosInstance } from 'axios';

/**
 * Cliente HTTP para consultar promociones activas desde el Microservicio de Eventos.
 */
export class PromotionService {
    private axiosInstance: AxiosInstance;

    constructor() {
        const baseURL = process.env.EVENT_SERVICE_URL || 'http://event-service-app:4005/api';

        this.axiosInstance = axios.create({
            baseURL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Obtener todos los IDs de productos que tienen promoción activa
     * @param accessToken Token de autenticación del usuario
     * @returns Lista de productos con su promoción asociada
     */
    async getActiveProductosPromocion(accessToken?: string): Promise<any[]> {
        const headers: any = { ...this.axiosInstance.defaults.headers.common };
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }
        try {
            const response = await this.axiosInstance.get('/producto-promocion/active-promotions', { headers });
            return response.data?.data?.products ?? [];
        } catch (error: any) {
            console.error('Error al obtener productos con promoción activa desde MS1:', error.message);
            return [];
        }
    }
}

export const promotionService = new PromotionService();
