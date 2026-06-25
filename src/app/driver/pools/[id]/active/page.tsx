import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { autoLockPool } from "@/app/actions";
import { getPoolPassengers, getPassengerRatings } from "../../../../../../externalApis";
import ActiveTripClient from "./ActiveTripClient";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: "Viaje Activo | WeShuttle Driver",
};

export default async function ActiveTripPage({ params }: Props) {
  const { id } = await params;

  let pool = await prisma.pool.findUnique({
    where: { id },
    include: { manifest_passengers: { orderBy: { pickup_order: "asc" } } }
  });

  if (!pool) return notFound();

  // 🚀 AUTO-LOCK CHECK: Solo si falta 1 hora o menos para la salida (departure_time)
  if (pool.status === "ASSIGNED") {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    if (pool.departure_time <= oneHourFromNow) {
      await autoLockPool(pool.id);
      const updatedPool = await prisma.pool.findUnique({
        where: { id },
        include: { manifest_passengers: { orderBy: { pickup_order: "asc" } } }
      });
      if (updatedPool) {
        pool = updatedPool;
      }
    }
  }

  // A partir de aquí garantizamos que pool no es null (si updatedPool fue null, pool sigue siendo el original no nulo)
  const activePool = pool!;

  // Cargar calificaciones desde Feedback App para este pool
  let ratingsResponse: any = null;
  try {
    ratingsResponse = await getPassengerRatings(activePool.id);
  } catch (error) {
    console.error("Error al obtener calificaciones desde Feedback App:", error);
  }

  // Cargar pasajeros según el estado del pool
  let manifestPassengers: any[] = [];
  if (activePool.status === "ASSIGNED") {
    try {
      const manifestResponse = await getPoolPassengers(activePool.id, "PAID");
      if (manifestResponse && manifestResponse.passengers) {
        manifestPassengers = manifestResponse.passengers.map((p, idx) => {
          const ratingData = ratingsResponse?.ratings?.find(
            (r: any) => r.passenger_user_id === p.passenger_user_id
          );
          return {
            id: p.reservation_id, // Usamos la reserva como ID temporal
            passenger_name: p.passenger_name,
            pickup_address: p.pickup_point.address,
            pickup_lat: p.pickup_point.lat,
            pickup_lng: p.pickup_point.lng,
            passenger_user_id: p.passenger_user_id,
            passenger_status: "PENDING",
            rating: ratingData ? ratingData.average_rating : null,
            total_reviews: ratingData ? ratingData.total_reviews : 0,
          };
        });
      }
    } catch (error) {
      console.error("Error al obtener pasajeros en tiempo real desde la Rider App:", error);
    }
  } else {
    // Si ya está LOCKED, IN_PROGRESS o COMPLETED
    if (activePool.manifest_passengers.length === 0) {
      // Intento de recuperación única si la BDD local no tiene registros
      try {
        const manifestResponse = await getPoolPassengers(activePool.id, "PAID");
        if (manifestResponse && manifestResponse.passengers && manifestResponse.passengers.length > 0) {
          // Guardar en la base de datos local para persistencia resiliente
          await prisma.operationalManifestSnapshotPassenger.createMany({
            data: manifestResponse.passengers.map((p, idx) => ({
              pool_id: activePool.id,
              reservation_id: p.reservation_id,
              passenger_user_id: p.passenger_user_id,
              passenger_name: p.passenger_name,
              pickup_address: p.pickup_point.address,
              pickup_lat: p.pickup_point.lat,
              pickup_lng: p.pickup_point.lng,
              pickup_order: idx + 1,
              passenger_status: "PENDING",
            }))
          });

          const passengersFromDb = await prisma.operationalManifestSnapshotPassenger.findMany({
            where: { pool_id: activePool.id },
            orderBy: { pickup_order: "asc" }
          });
          manifestPassengers = passengersFromDb.map((p) => {
            const ratingData = ratingsResponse?.ratings?.find(
              (r: any) => r.passenger_user_id === p.passenger_user_id
            );
            return {
              id: p.id,
              passenger_name: p.passenger_name,
              pickup_address: p.pickup_address,
              pickup_lat: p.pickup_lat,
              pickup_lng: p.pickup_lng,
              passenger_user_id: p.passenger_user_id,
              passenger_status: p.passenger_status,
              rating: ratingData ? ratingData.average_rating : null,
              total_reviews: ratingData ? ratingData.total_reviews : 0,
            };
          });
        }
      } catch (error) {
        console.error("Error al recuperar y guardar el manifiesto en la base de datos:", error);
      }
    } else {
      manifestPassengers = activePool.manifest_passengers.map((p) => {
        const ratingData = ratingsResponse?.ratings?.find(
          (r: any) => r.passenger_user_id === p.passenger_user_id
        );
        return {
          id: p.id,
          passenger_name: p.passenger_name,
          pickup_address: p.pickup_address,
          pickup_lat: p.pickup_lat,
          pickup_lng: p.pickup_lng,
          passenger_user_id: p.passenger_user_id,
          passenger_status: p.passenger_status,
          rating: ratingData ? ratingData.average_rating : null,
          total_reviews: ratingData ? ratingData.total_reviews : 0,
        };
      });
    }
  }

  // Buscamos los datos completos del pasajero al que estamos yendo a buscar actualmente
  const currentTargetPassenger = manifestPassengers.find(
    p => p.passenger_user_id === activePool.target_user_id
  ) || null;

  // Serializar objetos para transferir a Client Component de forma limpia
  const serializedPool = {
    id: activePool.id,
    destination_id: activePool.destination_id,
    status: activePool.status,
    target_user_id: activePool.target_user_id,
    hito: activePool.hito,
    manifest_passengers: manifestPassengers,
  };

  const serializedTargetPassenger = currentTargetPassenger ? {
    id: currentTargetPassenger.id,
    passenger_name: currentTargetPassenger.passenger_name,
    pickup_address: currentTargetPassenger.pickup_address,
    pickup_lat: currentTargetPassenger.pickup_lat,
    pickup_lng: currentTargetPassenger.pickup_lng,
    passenger_user_id: currentTargetPassenger.passenger_user_id,
    passenger_status: currentTargetPassenger.passenger_status,
    rating: currentTargetPassenger.rating,
    total_reviews: currentTargetPassenger.total_reviews,
  } : null;

  return (
    <ActiveTripClient
      pool={serializedPool}
      currentTargetPassenger={serializedTargetPassenger}
    />
  );
}