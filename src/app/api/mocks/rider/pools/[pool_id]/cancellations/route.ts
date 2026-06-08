import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    const body = await req.json();
    const { reason, message } = body;

    if (!reason) {
      return apiError("400 Bad Request", "Falta el motivo de cancelación.");
    }

    console.log(`[Rider Mock Cancelación] Notificada cancelación de Pool ${pool_id}. Razón: ${reason}. Mensaje: ${message}`);

    return NextResponse.json({
      pool_id,
      updated_reservations: 2,
      new_reservation_status: "CANCELED",
      notifications_sent: true
    });
  } catch {
    return apiError("500 Internal Server Error", "Error al procesar cancelación mock.");
  }
}
