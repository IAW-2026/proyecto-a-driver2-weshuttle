import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;

    const pool = await prisma.pool.findUnique({
      where: { id: pool_id },
      include: {
        driver: true,
        vehicle: true,
      }
    });

    if (!pool) {
      return apiError("404 Not Found", "El pool no existe.");
    }

    if (!pool.driver_id || !pool.driver) {
      return NextResponse.json({
        pool_id: pool.id,
        pool_status: pool.status,
        driver: null,
        vehicle: null
      });
    }

    return NextResponse.json({
      pool_id: pool.id,
      pool_status: pool.status,
      driver: {
        driver_user_id: pool.driver.clerk_user_id,
        full_name: pool.driver.full_name || "Conductor Registrado"
      },
      vehicle: pool.vehicle ? {
        vehicle_id: pool.vehicle.id,
        brand: pool.vehicle.brand,
        model: pool.vehicle.model,
        license_plate: pool.vehicle.license_plate
      } : null
    });
  } catch (error) {
    console.error("Error al obtener conductor asignado:", error);
    return apiError("500 Internal Server Error", "Error interno al consultar conductor asignado.");
  }
}
