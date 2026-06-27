import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pool_id, driver_user_id, started_at } = body;

    if (!pool_id || !driver_user_id || !started_at) {
      return apiError("400 Bad Request", "Faltan datos obligatorios.");
    }

    console.log(`[Feedback Mock Precreate] Precreando reseñas para Pool ${pool_id} con Conductor ${driver_user_id}.`);

    return NextResponse.json({
      pool_id,
      review_status: "PRECREATED",
      paid_passengers_count: 2,
      created_reviews: 4
    }, { status: 201 });
  } catch {
    return apiError("500 Internal Server Error", "Error al precrear reseñas mock.");
  }
}
