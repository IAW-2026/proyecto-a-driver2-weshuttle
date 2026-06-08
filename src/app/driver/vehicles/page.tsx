import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VehiclesClient from "./VehiclesClient";
import { getClerkUserEmail } from "@/lib/clerk-utils";

export const metadata = {
  title: "Mis Vehículos | WeShuttle Driver",
};

export default async function VehiclesPage() {
  const { userId, sessionClaims } = await auth();

  // Protección de ruta (Solo usuarios con rol 'driver')
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  const email = await getClerkUserEmail();

  // 🚀 AUTO-REGISTRO EN PRIMER LOGIN
  const driver = await prisma.driver.upsert({
    where: { clerk_user_id: userId },
    update: {
      email: email || undefined
    },
    create: {
      clerk_user_id: userId,
      email: email || "",
      full_name: (sessionClaims as { name?: string })?.name || "Conductor Nuevo",
      phone: "",
      status: "ACTIVE",
      verification_status: "PENDING",
    },
    include: { 
      vehicles: { 
        where: { status: "ACTIVE" }
      } 
    }
  });

  // Convertimos las fechas a strings para evitar advertencias de serialización en Next.js
  const serializedVehicles = driver.vehicles.map(vehicle => ({
    ...vehicle,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString(),
  }));

  return <VehiclesClient initialVehicles={serializedVehicles} />;
}