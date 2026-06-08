import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import MyTripsClient from "./MyTripsClient";

export const metadata = {
  title: "Mis Viajes | WeShuttle Driver",
};

export default async function MyTripsPage() {
  const { userId, sessionClaims } = await auth();

  // Protección de ruta (Solo usuarios con rol 'driver')
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  // 1. Obtener el conductor local
  const driver = await prisma.driver.findUnique({
    where: { clerk_user_id: userId },
  });

  if (!driver) {
    redirect("/");
  }

  // 2. Obtener los pools asignados con estado ASSIGNED, LOCKED o IN_PROGRESS
  const pools = await prisma.pool.findMany({
    where: {
      driver_id: driver.id,
      status: {
        in: ["ASSIGNED", "LOCKED", "IN_PROGRESS"],
      },
    },
    orderBy: {
      departure_time: "asc",
    },
  });

  // 3. Serializar objetos para el Client Component
  const serializedPools = pools.map((p) => ({
    id: p.id,
    destination_id: p.destination_id,
    departure_time: p.departure_time.toISOString(),
    status: p.status,
    current_passengers: p.current_passengers,
    max_capacity: p.max_capacity,
  }));

  return <MyTripsClient pools={serializedPools} />;
}
