export interface PickupPoint {
  address: string;
  lat: number;
  lng: number;
}

export interface Passenger {
  reservation_id: string;
  passenger_user_id: string;
  passenger_name: string;
  reservation_status: string;
  pickup_point: PickupPoint;
  destination_id: string;
  departure_time: string;
  max_price: number;
  effective_price: number | null;
}

export interface PoolPassengersResponse {
  pool_id: string;
  passengers: Passenger[];
}

/**
 * Obtiene la lista de pasajeros asociados a un pool.
 * Si RIDER_API_URL está definido, consume el servicio real.
 * De lo contrario, hace fallback al endpoint mockeado localmente.
 */
export async function getPoolPassengers(poolId: string, status?: string): Promise<PoolPassengersResponse> {
  // Determinamos la URL base y el path dependiendo del entorno
  const isMockMode = !process.env.RIDER_API_URL;
  const baseUrl = process.env.RIDER_API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const apiPath = isMockMode 
    ? `/api/mocks/rider/pools/${poolId}/passengers` 
    : `/api/pools/${poolId}/passengers`;
  
  const url = new URL(`${baseUrl}${apiPath}`);
  if (status) {
    url.searchParams.append('status', status);
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Rider API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Rider API] No se pudieron obtener los pasajeros del pool ${poolId}:`, error);
    // Retornamos un objeto de fallback válido para no romper la UI
    return { pool_id: poolId, passengers: [] };
  }
}