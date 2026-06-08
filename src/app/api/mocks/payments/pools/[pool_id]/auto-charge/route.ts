import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    const body = await req.json();
    const { departure_time, current_passengers } = body;

    if (!departure_time || current_passengers === undefined) {
      return apiError("400 Bad Request", "Faltan datos obligatorios.");
    }

    console.log(`[Payments Mock Auto-Charge] Iniciando cobro para Pool ${pool_id} con ${current_passengers} pasajeros.`);

    return NextResponse.json({
      pool_id,
      auto_charge_status: "STARTED",
      message: "El proceso de cobro automático fue iniciado."
    }, { status: 202 });
  } catch {
    return apiError("500 Internal Server Error", "Error al procesar auto-charge mock.");
  }
}
