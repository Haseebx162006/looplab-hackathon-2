import { HealthResponse } from '../types/health';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getHealthStatus(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/health`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch backend health status:', err);
    return null;
  }
}
