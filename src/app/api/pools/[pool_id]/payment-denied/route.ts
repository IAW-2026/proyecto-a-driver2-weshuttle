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
    const { reservation_id, passenger_user_id } = body;

    if (!reservation_id || !passenger_user_id) {
      return apiError("400 Bad Request", "Faltan datos obligatorios.");
    }

    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    if (!pool) {
      return apiError("404 Not Found", "El pool no existe.");
    }

    // Decrementar la ocupación
    const newPassengersCount = Math.max(0, pool.current_passengers - 1);
    
    // Si queda vacío, se cancela el viaje
    const newStatus = newPassengersCount === 0 ? "CANCELED" : pool.status;

    const updatedPool = await prisma.pool.update({
      where: { id: pool_id },
      data: {
        current_passengers: newPassengersCount,
        status: newStatus
      }
    });

    return NextResponse.json({
      pool_id: updatedPool.id,
      reservation_id,
      current_passengers: updatedPool.current_passengers,
      pool_status: updatedPool.status
    });
  } catch (error) {
    console.error("Error al procesar pago rechazado en pool:", error);
    return apiError("500 Internal Server Error", "Error interno al descontar la ocupación.");
  }
}
