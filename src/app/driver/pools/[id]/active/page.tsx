import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { autoLockPool } from "@/app/actions";
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

  // 🚀 AUTO-LOCK CHECK: Si el pool está ASSIGNED, lo cerramos automáticamente e inyectamos cobro y manifiesto
  if (pool.status === "ASSIGNED") {
    await autoLockPool(pool.id);
    const updatedPool = await prisma.pool.findUnique({
      where: { id },
      include: { manifest_passengers: { orderBy: { pickup_order: "asc" } } }
    });
    if (updatedPool) {
      pool = updatedPool;
    }
  }

  // Buscamos los datos completos del pasajero al que estamos yendo a buscar actualmente
  const currentTargetPassenger = pool.manifest_passengers.find(
    p => p.passenger_user_id === pool.target_user_id
  ) || null;

  // Serializar objetos para transferir a Client Component de forma limpia
  const serializedPool = {
    id: pool.id,
    destination_id: pool.destination_id,
    status: pool.status,
    target_user_id: pool.target_user_id,
    hito: pool.hito,
    manifest_passengers: pool.manifest_passengers.map((p) => ({
      id: p.id,
      passenger_name: p.passenger_name,
      pickup_address: p.pickup_address,
      passenger_user_id: p.passenger_user_id,
      passenger_status: p.passenger_status,
    })),
  };

  const serializedTargetPassenger = currentTargetPassenger ? {
    id: currentTargetPassenger.id,
    passenger_name: currentTargetPassenger.passenger_name,
    pickup_address: currentTargetPassenger.pickup_address,
    passenger_user_id: currentTargetPassenger.passenger_user_id,
    passenger_status: currentTargetPassenger.passenger_status,
  } : null;

  return (
    <ActiveTripClient
      pool={serializedPool}
      currentTargetPassenger={serializedTargetPassenger}
    />
  );
}