import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const destinationId = searchParams.get("destination_id");
    const departureTimeParam = searchParams.get("departure_time");

    if (!destinationId || !departureTimeParam) {
      return apiError("400 Bad Request", "destination_id o departure_time ausente o inválido.");
    }

    const departureTime = new Date(departureTimeParam);
    if (isNaN(departureTime.getTime())) {
      return apiError("400 Bad Request", "Formato de departure_time inválido.");
    }

    const pools = await prisma.pool.findMany({
      where: {
        destinationId: destinationId,
        departureTime: departureTime,
        status: {
          in: ["AVAILABLE", "ASSIGNED"],
        },
      },
    });

    const compatiblePool = pools.find((p) => p.currentPassengers < p.maxCapacity);

    if (compatiblePool) {
      return NextResponse.json({
        exists: true,
        pool: {
          pool_id: compatiblePool.id,
          destination_id: compatiblePool.destinationId,
          departure_time: compatiblePool.departureTime.toISOString(),
          status: compatiblePool.status,
          current_passengers: compatiblePool.currentPassengers,
          max_capacity: compatiblePool.maxCapacity,
        },
      });
    }

    return NextResponse.json({
      exists: false,
      pool: null,
    });
  } catch (error) {
    console.error("Error al buscar pools:", error);
    return apiError("500 Internal Server Error", "Error interno al buscar pools.");
  }
}
