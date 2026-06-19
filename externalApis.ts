import prisma from "@/lib/prisma";

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

const mockNames = [
  "Franco Gulino", //1
  "Juan Ignacio Ibarra", //2
  "Juliana Pagani", //3
  "Juan Bassi", //4
  "María Rodríguez", //5
  "Carlos Sánchez", //6
  "Ana Martínez", //7
  "José Gómez", //8
  "Laura Pérez", //9
  "Daniel Díaz", //10
  "Luis Torres", //11
  "Sofía Flores", //12
  "Marcos Gomez", //13
  "Sofia Anton", //14
  "Valeria Salto", //15
];

function getBaseUrl(envVar: string): string {
  // Primero intentamos la variable específica, luego NEXT_PUBLIC_APP_URL, y finalmente localhost
  return process.env[envVar] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * Obtiene la lista de pasajeros asociados a un pool.
 */
export async function getPoolPassengers(poolId: string, status?: string): Promise<PoolPassengersResponse> {
  const isMockMode = !process.env.RIDER_API_URL;

  if (isMockMode) {
    try {
      const pool = await prisma.pool.findUnique({
        where: { id: poolId }
      });

      if (!pool) {
        return { pool_id: poolId, passengers: [] };
      }

      const count = pool.current_passengers;
      const passengers: Passenger[] = [];

      for (let i = 0; i < count; i++) {
        const name = mockNames[i % mockNames.length];
        // Si el pool está LOCK, IN_PROGRESS o COMPLETED, simulamos que los cobros ya se realizaron con éxito
        const reservationStatus = status || (["LOCKED", "IN_PROGRESS", "COMPLETED"].includes(pool.status) ? "PAID" : "CONFIRMED");

        passengers.push({
          reservation_id: `res_mock_${poolId}_${i + 1}`,
          passenger_user_id: `usr_mock_passenger_${i + 1}`,
          passenger_name: name,
          reservation_status: reservationStatus,
          pickup_point: {
            address: `Av. Alem ${1000 + (i * 100)}, Bahía Blanca`,
            lat: -38.718 + (i * 0.002),
            lng: -62.266 + (i * 0.002)
          },
          destination_id: pool.destination_id,
          departure_time: pool.departure_time.toISOString(),
          max_price: 5000,
          effective_price: ["LOCKED", "IN_PROGRESS", "COMPLETED"].includes(pool.status) ? 3800 : null
        });
      }

      return {
        pool_id: poolId,
        passengers
      };
    } catch (error) {
      console.error(`[Rider API Mock] Error al generar pasajeros simulados para pool ${poolId}:`, error);
      return { pool_id: poolId, passengers: [] };
    }
  }

  const baseUrl = getBaseUrl('RIDER_API_URL');
  const apiPath = `/api/pools/${poolId}/passengers`;
  const url = new URL(`${baseUrl}${apiPath}`);
  if (status) {
    url.searchParams.append('payment_status', status);
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
    return { pool_id: poolId, passengers: [] };
  }
}

/**
 * Notifica a la Rider App de la cancelación de un pool.
 */
export async function cancelPoolOnRiderApp(poolId: string, reason: string, message: string) {
  const isMockMode = !process.env.RIDER_API_URL;

  if (isMockMode) {
    console.log(`[Rider Mock Cancel] Cancelando pool ${poolId} en Rider App. Razón: ${reason}. Mensaje: ${message}`);
    return {
      pool_id: poolId,
      status: "CANCELED",
      message: "Viaje cancelado exitosamente en Rider App."
    };
  }

  const baseUrl = getBaseUrl('RIDER_API_URL');
  const apiPath = `/api/pools/${poolId}/cancellations`;

  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason, message }),
    });

    return await response.json();
  } catch (error) {
    console.error(`[Rider API] Error al notificar cancelación a Rider App para pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Solicita el cálculo de ajustes de crédito en Payments App (cierre T-1h o cancelación).
 */
export async function triggerCreditAdjustments(
  poolId: string,
  reason: "POOL_LOCKED" | "NO_DRIVER_ASSIGNED",
  departureTime: string,
  currentPassengers: number
) {
  const isMockMode = !process.env.PAYMENTS_API_URL;

  if (isMockMode) {
    console.log(`[Payments Mock Credit Adjustments] Calculando ajustes para Pool ${poolId} con motivo ${reason} y ${currentPassengers} pasajeros.`);
    return {
      pool_id: poolId,
      reason,
      final_price: reason === "NO_DRIVER_ASSIGNED" ? 0 : 3800,
      processed_reservations: currentPassengers,
      currency: "ARS",
      credits_generated: []
    };
  }

  const baseUrl = getBaseUrl('PAYMENTS_API_URL');
  const apiPath = `/api/payments/pools/${poolId}/credit-adjustments`;

  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason,
        departure_time: departureTime,
        current_passengers: currentPassengers
      }),
    });

    return await response.json();
  } catch (error) {
    console.error(`[Payments API] Error al iniciar ajustes de crédito para pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Solicita la liquidación de fondos al conductor en Payments App.
 */
export async function settlePoolFunds(poolId: string, driverUserId: string, completedAt: string) {
  const isMockMode = !process.env.PAYMENTS_API_URL;

  if (isMockMode) {
    console.log(`[Payments Mock Settle] Liquidando fondos para Pool ${poolId} de Conductor ${driverUserId} completado a las ${completedAt}.`);
    return {
      settlement_id: `settlement_mock_${poolId}`,
      settlement_status: "COMPLETED",
      pool_id: poolId,
      driver_user_id: driverUserId,
      amount_settled: 45000,
      completed_at: completedAt
    };
  }

  const baseUrl = getBaseUrl('PAYMENTS_API_URL');
  const apiPath = `/api/payments/pools/${poolId}/settle`;

  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driver_user_id: driverUserId,
        completed_at: completedAt
      }),
    });

    return await response.json();
  } catch (error) {
    console.error(`[Payments API] Error al liquidar fondos para pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Notifica a la Feedback App del inicio de un viaje para precrear reseñas.
 */
export async function precreateReviews(poolId: string, driverUserId: string, startedAt: string) {
  const isMockMode = !process.env.FEEDBACK_API_URL;

  if (isMockMode) {
    console.log(`[Feedback Mock Precreate] Precreando reseñas para Pool ${poolId} con Conductor ${driverUserId}.`);
    return {
      pool_id: poolId,
      review_status: "PRECREATED",
      message: "Reseñas pre-creadas para el pool."
    };
  }

  const baseUrl = getBaseUrl('FEEDBACK_API_URL');
  const apiPath = `/api/reviews/precreate`;

  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pool_id: poolId,
        driver_user_id: driverUserId,
        started_at: startedAt
      }),
    });

    return await response.json();
  } catch (error) {
    console.error(`[Feedback API] Error al precrear reseñas para pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Obtiene el promedio de calificaciones de los pasajeros de un pool.
 */
export async function getPassengerRatings(poolId: string) {
  const isMockMode = !process.env.FEEDBACK_API_URL;

  if (isMockMode) {
    console.log(`[Feedback Mock Ratings] Obteniendo calificaciones de pasajeros para Pool ${poolId}.`);
    return {
      pool_id: poolId,
      ratings: []
    };
  }

  const baseUrl = getBaseUrl('FEEDBACK_API_URL');
  const apiPath = `/api/ratings/pools/${poolId}/passengers`;

  try {
    const response = await fetch(`${baseUrl}${apiPath}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error(`[Feedback API] Error al obtener calificaciones para pasajeros del pool ${poolId}:`, error);
    return { pool_id: poolId, ratings: [] };
  }
}
