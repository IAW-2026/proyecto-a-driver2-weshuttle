import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";
import { checkAndCancelExpiredPools } from "@/app/actions";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;

    // Limpieza de pools vencidos
    await checkAndCancelExpiredPools();

    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    if (!pool) {
      return apiError("404 Not Found", "El pool no existe.");
    }

    return NextResponse.json({
      pool_id: pool.id,
      status: pool.status,
      destination_id: pool.destination_id,
      departure_time: pool.departure_time.toISOString(),
      current_passengers: pool.current_passengers,
      max_capacity: pool.max_capacity,
      target_user_id: pool.target_user_id,
      hito: pool.hito,
      updated_at: pool.updatedAt.toISOString()
    });
  } catch (error) {
    console.error("Error al obtener estado del pool:", error);
    return apiError("500 Internal Server Error", "Error interno al consultar el estado del pool.");
  }
}
