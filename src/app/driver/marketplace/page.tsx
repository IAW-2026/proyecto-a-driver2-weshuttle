import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getClerkUserEmail } from "@/lib/clerk-utils";
import MarketplaceClient from "./MarketplaceClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Viajes Disponibles | WeShuttle Driver",
};

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;

  const pageSize = 5;
  const validPage = isNaN(page) || page < 1 ? 1 : page;
  const skip = (validPage - 1) * pageSize;

  // 1. Recuperamos la sesión y los claims del usuario logueado en Clerk
  const { userId, sessionClaims } = await auth();
  
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  const email = await getClerkUserEmail();

  // 2. 🚀 AUTO-REGISTRO EN PRIMER LOGIN
  const currentDriver = await prisma.driver.upsert({
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
    include: { vehicles: { where: { status: "ACTIVE" } } }
  });

  // En el Marketplace de viajes, solo mostramos pools que están AVAILABLE (disponibles)
  const whereClause = {
    status: "AVAILABLE" as const,
    driver_id: null,
  };

  const [totalCount, pools] = await prisma.$transaction([
    prisma.pool.count({ where: whereClause }),
    prisma.pool.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { departure_time: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Serializar objetos para transferir a Client Component de forma limpia
  const serializedPools = pools.map((p) => ({
    id: p.id,
    destination_id: p.destination_id,
    departure_time: p.departure_time.toISOString(),
    status: p.status,
    current_passengers: p.current_passengers,
    max_capacity: p.max_capacity,
  }));

  const serializedDriver = {
    id: currentDriver.id,
    verification_status: currentDriver.verification_status,
    vehicles: currentDriver.vehicles.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      license_plate: v.license_plate,
      capacity: v.capacity,
    })),
  };

  return (
    <MarketplaceClient
      pools={serializedPools}
      currentDriver={serializedDriver}
      validPage={validPage}
      totalPages={totalPages}
    />
  );
}