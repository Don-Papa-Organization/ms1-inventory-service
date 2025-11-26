import { HttpClient } from "./httpClient";

class DatabaseServiceHttp extends HttpClient {
    constructor() {
        super(process.env.DATABASE_SERVICE_URL || 'http://inventory-service-db:3001')
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.instance.get('/health');
            return response.status === 200;
        } catch {
            return false;
        }
    }
}

export const databaseService = new DatabaseServiceHttp();