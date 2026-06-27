import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pool_id, driver_user_id, message } = body;

    if (!pool_id || !driver_user_id || !message) {
      return apiError("400 Bad Request", "Faltan datos obligatorios.");
    }

    // Verificar existencia del pool
    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    // Verificar existencia del conductor por Clerk user ID
    const driver = await prisma.driver.findUnique({
      where: { clerk_user_id: driver_user_id }
    });

    if (!pool || !driver) {
      return apiError("404 Not Found", "No existe el conductor o el pool indicado.");
    }

    // Guardar la notificación en la base de datos local
    await prisma.notification.create({
      data: {
        driver_user_id,
        pool_id,
        message,
        read: false
      }
    });

    console.log(`[Feedback Notificación] Guardada notificación para Conductor ${driver_user_id} para Pool ${pool_id}: ${message}`);

    return NextResponse.json({
      notification_sent: true
    });
  } catch (error) {
    console.error("Error al procesar notificación de feedback:", error);
    return apiError("500 Internal Server Error", "Error interno al procesar la notificación.");
  }
}
