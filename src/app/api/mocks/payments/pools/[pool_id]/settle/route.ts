import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    const body = await req.json();
    const { driver_user_id, completed_at } = body;

    if (!driver_user_id || !completed_at) {
      return apiError("400 Bad Request", "Faltan datos obligatorios.");
    }

    console.log(`[Payments Mock Settle] Liquidando fondos para Pool ${pool_id} de Conductor ${driver_user_id} completado a las ${completed_at}.`);

    return NextResponse.json({
      pool_id,
      settlement_id: `settlement_mock_${pool_id}`,
      settlement_status: "COMPLETED",
      driver_user_id,
      amount: 30400,
      currency: "ARS"
    });
  } catch {
    return apiError("500 Internal Server Error", "Error al procesar settle mock.");
  }
}
