export interface HealthResponse {
  success: boolean;
  data: {
    status: string;
    uptime: number;
    timestamp: string;
    services: {
      database: string;
      pgvector: string;
    };
  };
}
