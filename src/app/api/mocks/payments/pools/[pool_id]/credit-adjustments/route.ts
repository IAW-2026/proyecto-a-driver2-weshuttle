import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    const body = await req.json();
    const { reason, departure_time, current_passengers } = body;

    if (!reason || !departure_time || current_passengers === undefined) {
      return apiError("400 Bad Request", "Faltan datos obligatorios (reason, departure_time, current_passengers).");
    }

    if (reason !== "POOL_LOCKED" && reason !== "NO_DRIVER_ASSIGNED") {
      return apiError("400 Bad Request", "Motivo de ajuste (reason) inválido.");
    }

    console.log(`[Payments Mock Credit-Adjustments] Calculando ajustes para Pool ${pool_id} con motivo ${reason} y ${current_passengers} pasajeros.`);

    if (reason === "NO_DRIVER_ASSIGNED") {
      return NextResponse.json({
        pool_id,
        reason,
        final_price: 0,
        processed_reservations: current_passengers,
        currency: "ARS",
        credits_generated: Array.from({ length: current_passengers }).map((_, idx) => ({
          reservation_id: `res_mock_${pool_id}_${idx + 1}`,
          passenger_user_id: `usr_mock_passenger_${idx + 1}`,
          max_price_paid: 5000,
          final_price: 0,
          credit_granted: 5000,
          credit_balance_after: 5000
        }))
      }, { status: 200 });
    }

    // Caso POOL_LOCKED
    const finalPrice = 3800; // precio final simulado
    const maxPrice = 5000;
    const creditGranted = maxPrice - finalPrice;

    return NextResponse.json({
      pool_id,
      reason,
      final_price: finalPrice,
      processed_reservations: current_passengers,
      currency: "ARS",
      credits_generated: Array.from({ length: current_passengers }).map((_, idx) => ({
        reservation_id: `res_mock_${pool_id}_${idx + 1}`,
        passenger_user_id: `usr_mock_passenger_${idx + 1}`,
        max_price_paid: maxPrice,
        final_price: finalPrice,
        credit_granted: creditGranted,
        credit_balance_after: creditGranted
      }))
    }, { status: 200 });
  } catch (error) {
    console.error("Error en mock de credit-adjustments:", error);
    return apiError("500 Internal Server Error", "Error al procesar credit-adjustments mock.");
  }
}
