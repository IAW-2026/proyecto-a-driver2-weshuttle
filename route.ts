import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { pool_id: string } }
) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const poolId = params.pool_id;

  // Mocks basados estrictamente en el contrato de 03-apis.md
  const allPassengers = [
    {
      reservation_id: "res_101",
      passenger_user_id: "user_abc123",
      passenger_name: "Franco Gulino",
      reservation_status: "PAID",
      pickup_point: {
        address: "Av. Alem 1250, Bahía Blanca",
        lat: -38.718,
        lng: -62.266
      },
      destination_id: "dest_polo_petroquimico",
      departure_time: "2026-06-10T08:00:00Z",
      max_price: 5000,
      effective_price: 3800
    },
    {
      reservation_id: "res_102",
      passenger_user_id: "user_def456",
      passenger_name: "Juan Ignacio Ibarra",
      reservation_status: "PENDING_DRIVER",
      pickup_point: {
        address: "Sarmiento 850, Bahía Blanca",
        lat: -38.713,
        lng: -62.261
      },
      destination_id: "dest_polo_petroquimico",
      departure_time: "2026-06-10T08:00:00Z",
      max_price: 5000,
      effective_price: null
    }
  ];

  // Filtramos por estado si la request lo requiere (ej. ?status=PAID)
  const passengers = status 
    ? allPassengers.filter(p => p.reservation_status === status)
    : allPassengers;

  return NextResponse.json({
    pool_id: poolId,
    passengers
  });
}