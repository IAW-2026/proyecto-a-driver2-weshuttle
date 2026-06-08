import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { destination_id, departure_time, reservation_id, passenger_user_id, pickup_point } = body;

    if (
      !destination_id || 
      !departure_time || 
      !reservation_id || 
      !passenger_user_id || 
      !pickup_point || 
      !pickup_point.address || 
      pickup_point.lat === undefined || 
      pickup_point.lng === undefined
    ) {
      return apiError("400 Bad Request", "Faltan datos obligatorios o tienen formato inválido.");
    }

    const departureDate = new Date(departure_time);
    if (isNaN(departureDate.getTime())) {
      return apiError("400 Bad Request", "Formato de departure_time inválido.");
    }

    // Validar si ya existe un pool disponible y compatible en el mismo horario y destino
    const existingPool = await prisma.pool.findFirst({
      where: {
        destination_id,
        departure_time: departureDate,
        status: "AVAILABLE",
        current_passengers: {
          lt: 15
        }
      }
    });

    if (existingPool) {
      return apiError("409 Conflict", "Ya existe un pool compatible para este destino y horario.");
    }

    // Crear el nuevo pool
    const newPool = await prisma.pool.create({
      data: {
        destination_id,
        departure_time: departureDate,
        status: "AVAILABLE",
        current_passengers: 1,
        max_capacity: 15,
      }
    });

    return NextResponse.json({
      pool_id: newPool.id,
      status: newPool.status,
      current_passengers: newPool.current_passengers,
      max_capacity: newPool.max_capacity,
    }, { status: 201 });
  } catch (error) {
    console.error("Error al crear el pool:", error);
    return apiError("500 Internal Server Error", "Error interno al crear el pool.");
  }
}
