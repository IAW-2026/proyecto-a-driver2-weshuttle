import { NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import prisma from "@/lib/prisma";

interface Params {
  params: Promise<{ pool_id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { pool_id } = await params;
    
    const pool = await prisma.pool.findUnique({
      where: { id: pool_id }
    });

    if (!pool) {
      return apiError("404 Not Found", "Pool no encontrado.");
    }

    const mockNames = [
      "Franco Gulino",
      "Juan Ignacio Ibarra",
      "Juliana Pagani",
      "Juan Bassi",
      "María Rodríguez",
      "Carlos Sánchez"
    ];

    const ratings = [];
    for (let i = 0; i < pool.current_passengers; i++) {
      ratings.push({
        passenger_user_id: `usr_mock_passenger_${i + 1}`,
        passenger_name: mockNames[i % mockNames.length],
        average_rating: +(4.2 + (i % 3) * 0.3).toFixed(1),
        total_reviews: 5 + (i * 2)
      });
    }

    return NextResponse.json({
      pool_id,
      ratings
    });
  } catch {
    return apiError("500 Internal Server Error", "Error al obtener calificaciones mock.");
  }
}
