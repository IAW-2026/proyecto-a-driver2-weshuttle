import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    const body = await req.json();
    const { reservation_id, passenger_user_id, pickup_point } = body;

    if (
      !reservation_id || 
      !passenger_user_id || 
      !pickup_point || 
      !pickup_point.address || 
      pickup_point.lat === undefined || 
      pickup_point.lng === undefined
    ) {
      return apiError("400 Bad Request", "Faltan datos obligatorios.");
    }

    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    if (!pool) {
      return apiError("404 Not Found", "El pool no existe.");
    }

    if (pool.status !== "AVAILABLE") {
      return apiError("409 Conflict", "El pool no está disponible para recibir nuevas reservas.");
    }

    if (pool.current_passengers >= pool.max_capacity) {
      return apiError("409 Conflict", "El pool alcanzó su capacidad máxima de pasajeros.");
    }

    // Incrementar el contador de pasajeros
    const updatedPool = await prisma.pool.update({
      where: { id: pool_id },
      data: {
        current_passengers: {
          increment: 1
        }
      }
    });

    return NextResponse.json({
      pool_id: updatedPool.id,
      reservation_id,
      pool_status: updatedPool.status,
      current_passengers: updatedPool.current_passengers,
      max_capacity: updatedPool.max_capacity,
    });
  } catch (error) {
    console.error("Error al asociar reserva al pool:", error);
    return apiError("500 Internal Server Error", "Error interno al asociar la reserva al pool.");
  }
}
