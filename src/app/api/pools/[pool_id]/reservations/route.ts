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
    console.log(`[API POST /api/pools/${pool_id}/reservations] Recibido request para agregar. Body:`, JSON.stringify(body));

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

    // Verificar si la reserva ya está registrada en este pool para evitar duplicaciones por reservation_id o passenger_user_id
    const existingPassenger = await prisma.operationalManifestSnapshotPassenger.findFirst({
      where: {
        pool_id: pool_id,
        OR: [
          { reservation_id: reservation_id },
          { passenger_user_id: passenger_user_id }
        ]
      }
    });

    console.log(`[API POST /api/pools/${pool_id}/reservations] ¿Ya existe el pasajero?`, existingPassenger ? "SÍ" : "NO");

    let updatedPool = pool;

    if (!existingPassenger) {
      // Registrar al pasajero en la tabla de snapshots temporales
      await prisma.operationalManifestSnapshotPassenger.create({
        data: {
          pool_id,
          reservation_id,
          passenger_user_id,
          passenger_name: "Pasajero", // Temporal, se sobrescribe en T-1h
          pickup_address: pickup_point.address,
          pickup_lat: pickup_point.lat,
          pickup_lng: pickup_point.lng,
          passenger_status: "PENDING"
        }
      });

      // Incrementar el contador de pasajeros
      updatedPool = await prisma.pool.update({
        where: { id: pool_id },
        data: {
          current_passengers: {
            increment: 1
          }
        }
      });
    }

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
