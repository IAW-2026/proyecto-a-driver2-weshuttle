import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

const mockNames = [
  "Franco Gulino",
  "Juan Ignacio Ibarra",
  "Juliana Pagani",
  "Juan Bassi",
  "María Rodríguez",
  "Carlos Sánchez",
  "Ana Martínez",
  "José Gómez",
  "Laura Pérez",
  "Daniel Díaz",
  "Luis Torres",
  "Sofía Flores"
];

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const statusFilter = searchParams.get("status");

    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    if (!pool) {
      return apiError("404 Not Found", "El pool no existe para Rider App.");
    }

    const count = pool.current_passengers;
    const passengers = [];

    for (let i = 0; i < count; i++) {
      const name = mockNames[i % mockNames.length];
      // Si el pool está LOCK, IN_PROGRESS o COMPLETED, simulamos que los cobros ya se realizaron con éxito
      const reservationStatus = statusFilter || (["LOCKED", "IN_PROGRESS", "COMPLETED"].includes(pool.status) ? "PAID" : "CONFIRMED");

      passengers.push({
        reservation_id: `res_mock_${pool_id}_${i + 1}`,
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

    return NextResponse.json({
      pool_id,
      passengers
    });
  } catch (error) {
    console.error("Error en mock de pasajeros:", error);
    return apiError("500 Internal Server Error", "Error interno al simular pasajeros.");
  }
}
