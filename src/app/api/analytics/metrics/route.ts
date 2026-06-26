import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-response";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const destinationNames: Record<string, string> = {
  'dest_polo_petroquimico': 'Polo Petroquímico',
  'dest_puerto_ingeniero_white': 'Puerto de Ingeniero White',
  'dest_parque_industrial': 'Parque Industrial',
};

const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const startDateStr = searchParams.get("start_date");
    const endDateStr = searchParams.get("end_date");

    // Validar formato si están presentes
    if (startDateStr && !dateRegex.test(startDateStr)) {
      return apiError("400 Bad Request", "El formato de start_date debe ser YYYY-MM-DD");
    }
    if (endDateStr && !dateRegex.test(endDateStr)) {
      return apiError("400 Bad Request", "El formato de end_date debe ser YYYY-MM-DD");
    }

    let startLocal = startDateStr;
    let endLocal = endDateStr;

    // Si falta alguno, aplicar fallback de los últimos 15 días
    if (!startLocal || !endLocal) {
      const nowUtc = new Date();
      // Desplazamiento a hora local Argentina (UTC-3)
      const nowArg = new Date(nowUtc.getTime() - 3 * 60 * 60 * 1000);
      
      const y = nowArg.getUTCFullYear();
      const m = String(nowArg.getUTCMonth() + 1).padStart(2, '0');
      const d = String(nowArg.getUTCDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      const fifteenDaysAgo = new Date(nowArg.getTime() - 15 * 24 * 60 * 60 * 1000);
      const agoY = fifteenDaysAgo.getUTCFullYear();
      const agoM = String(fifteenDaysAgo.getUTCMonth() + 1).padStart(2, '0');
      const agoD = String(fifteenDaysAgo.getUTCDate()).padStart(2, '0');
      const agoStr = `${agoY}-${agoM}-${agoD}`;

      startLocal = startLocal || agoStr;
      endLocal = endLocal || todayStr;
    }

    // Convertir de local Argentina (UTC-3) a UTC para la consulta a la BD
    const [sYear, sMonth, sDay] = startLocal.split('-').map(Number);
    const startUtc = new Date(Date.UTC(sYear, sMonth - 1, sDay, 3, 0, 0, 0));

    const [eYear, eMonth, eDay] = endLocal.split('-').map(Number);
    // 23:59:59.999 en Argentina equivale al día siguiente a las 02:59:59.999 UTC
    const endUtc = new Date(Date.UTC(eYear, eMonth - 1, eDay + 1, 2, 59, 59, 999));

    // Obtener los pools en el periodo
    const pools = await prisma.pool.findMany({
      where: {
        departure_time: {
          gte: startUtc,
          lte: endUtc,
        },
      },
    });

    // 1. totalPools & totalPoolsCreated (excluyendo CANCELED)
    const poolsWithoutCanceled = pools.filter(p => p.status !== "CANCELED");
    const totalPools = poolsWithoutCanceled.length;

    // 2. poolsByStatus (AVAILABLE, ASSIGNED, LOCKED, IN_PROGRESS, COMPLETED, CANCELED)
    const poolsByStatus = {
      AVAILABLE: 0,
      ASSIGNED: 0,
      LOCKED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELED: 0
    };
    for (const p of pools) {
      if (p.status in poolsByStatus) {
        poolsByStatus[p.status]++;
      }
    }

    // 3. activeVehicles & activeVehiclesCount (COMPLETED o IN_PROGRESS)
    const activeVehicleIds = new Set(
      pools
        .filter(p => (p.status === "COMPLETED" || p.status === "IN_PROGRESS") && p.vehicle_id)
        .map(p => p.vehicle_id)
    );
    const activeVehiclesCount = activeVehicleIds.size;

    // 4. driverUtilizationRate: conductores activos (status !== CANCELED) / total de conductores registrados
    const activeDriverIds = new Set(
      pools
        .filter(p => p.status !== "CANCELED" && p.driver_id)
        .map(p => p.driver_id)
    );
    const activeDriversCount = activeDriverIds.size;
    const totalDriversCount = await prisma.driver.count();
    const driverUtilizationRate = totalDriversCount > 0
      ? parseFloat(((activeDriversCount / totalDriversCount) * 100).toFixed(1))
      : 0.0;

    // 5. poolsDistributionByDay: conteo por día de la semana (Lunes, Martes, etc.) en hora Argentina
    const poolsDistributionByDay: Record<string, number> = {
      'Lunes': 0,
      'Martes': 0,
      'Miércoles': 0,
      'Jueves': 0,
      'Viernes': 0,
      'Sábado': 0,
      'Domingo': 0,
    };
    for (const p of poolsWithoutCanceled) {
      // Restar 3 horas para obtener hora de Argentina
      const localDate = new Date(p.departure_time.getTime() - 3 * 60 * 60 * 1000);
      const dayName = daysOfWeek[localDate.getUTCDay()];
      if (dayName in poolsDistributionByDay) {
        poolsDistributionByDay[dayName]++;
      }
    }

    // 6. travelTrends (Evolución diaria o 24 buckets horarios)
    const sDateOnly = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    const eDateOnly = new Date(Date.UTC(eYear, eMonth - 1, eDay));
    const diffDays = Math.round((eDateOnly.getTime() - sDateOnly.getTime()) / (24 * 60 * 60 * 1000));
    const isHourly = diffDays < 2; // Rango de 1 o 2 días

    let travelTrends: { date: string, poolCount: number }[] = [];

    if (isHourly) {
      // Generar 24 buckets de "00:00" a "23:00"
      const hourBuckets: Record<string, number> = {};
      for (let h = 0; h < 24; h++) {
        hourBuckets[`${String(h).padStart(2, '0')}:00`] = 0;
      }

      for (const p of poolsWithoutCanceled) {
        const localDate = new Date(p.departure_time.getTime() - 3 * 60 * 60 * 1000);
        const hourStr = `${String(localDate.getUTCHours()).padStart(2, '0')}:00`;
        if (hourStr in hourBuckets) {
          hourBuckets[hourStr]++;
        }
      }

      travelTrends = Object.entries(hourBuckets).map(([date, poolCount]) => ({
        date,
        poolCount,
      }));
    } else {
      // Generar buckets diarios
      const dailyBuckets: Record<string, number> = {};
      const current = new Date(sDateOnly);
      while (current <= eDateOnly) {
        const cy = current.getUTCFullYear();
        const cm = String(current.getUTCMonth() + 1).padStart(2, '0');
        const cd = String(current.getUTCDate()).padStart(2, '0');
        dailyBuckets[`${cy}-${cm}-${cd}`] = 0;
        current.setUTCDate(current.getUTCDate() + 1);
      }

      for (const p of poolsWithoutCanceled) {
        const localDate = new Date(p.departure_time.getTime() - 3 * 60 * 60 * 1000);
        const py = localDate.getUTCFullYear();
        const pm = String(localDate.getUTCMonth() + 1).padStart(2, '0');
        const pd = String(localDate.getUTCDate()).padStart(2, '0');
        const dateStr = `${py}-${pm}-${pd}`;
        if (dateStr in dailyBuckets) {
          dailyBuckets[dateStr]++;
        }
      }

      travelTrends = Object.entries(dailyBuckets).map(([date, poolCount]) => ({
        date,
        poolCount,
      }));
    }

    // 7. topRoutes: las 5 rutas más solicitadas agrupadas por destino
    const routeCounts: Record<string, number> = {};
    for (const p of poolsWithoutCanceled) {
      const destId = p.destination_id;
      routeCounts[destId] = (routeCounts[destId] || 0) + 1;
    }

    const topRoutes = Object.entries(routeCounts)
      .map(([destId, count]) => {
        const name = destinationNames[destId] || destId;
        return {
          destination: name,
          poolCount: count,
        };
      })
      .sort((a, b) => b.poolCount - a.poolCount)
      .slice(0, 5);

    return NextResponse.json({
      totalPools,
      totalPoolsCreated: totalPools,
      poolsByStatus,
      driverUtilizationRate,
      activeVehicles: activeVehiclesCount,
      activeVehiclesCount,
      poolsDistributionByDay,
      travelTrends,
      topRoutes,
    });

  } catch (error) {
    console.error("Error al obtener métricas de analíticas:", error);
    return apiError("500 Internal Server Error", "Error interno del servidor al calcular métricas.");
  }
}
