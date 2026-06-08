import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string; reservation_id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { pool_id, reservation_id } = await params;

    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    if (!pool) {
      return apiError("404 Not Found", "El pool no existe.");
    }

    if (pool.status === "LOCKED") {
      return apiError("409 Conflict", "El pool está confirmado y no permite cancelaciones voluntarias.");
    }

    // Calcular nueva cantidad de pasajeros (mínimo 0)
    const newPassengersCount = Math.max(0, pool.current_passengers - 1);
    
    // Si queda vacío se marca como CANCELED
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
    console.error("Error al cancelar la reserva en el pool:", error);
    return apiError("500 Internal Server Error", "Error interno al cancelar la reserva en el pool.");
  }
}
