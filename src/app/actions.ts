'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function updateDriverVerificationStatus(formData: FormData) {
  try {
    const { sessionClaims } = await auth();
    if ((sessionClaims?.role as string | undefined) !== "admin") {
      return { error: "No tienes permisos de administrador para realizar esta acción." };
    }
    const driverId = formData.get('driverId') as string;
    const status = formData.get('status') as string;

    await prisma.driver.update({
      where: { id: driverId },
      data: { verification_status: status },
    });
    revalidatePath('/admin/dashboard');
  } catch (error) {
    return { error: "Ocurrió un error interno al actualizar el estado." };
  }
}

export async function registerVehicle(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.role !== "driver") {
      return { error: "No tienes permisos de conductor." };
    }
    const brand = formData.get('brand') as string;
    const model = formData.get('model') as string;
    const licensePlate = (formData.get('license_plate') as string).toUpperCase().replace(/\s/g, '');
    const capacity = parseInt(formData.get('capacity') as string, 10);

    if (!brand || !model || !licensePlate || isNaN(capacity)) {
      return { error: "Todos los campos son obligatorios." };
    }
    if (capacity <= 0 || capacity > 15) {
      return { error: "La capacidad máxima permitida es de 15 pasajeros." };
    }
    const plateRegex = /^[A-Z0-9]{6,7}$/;
    if (!plateRegex.test(licensePlate)) {
      return { error: "Patente inválida." };
    }

    const driver = await prisma.driver.upsert({
      where: { clerk_user_id: userId },
      update: {},
      create: { clerk_user_id: userId, full_name: "Conductor", status: "ACTIVE", verification_status: "PENDING" }
    });

    const existingVehicle = await prisma.vehicle.findUnique({ where: { license_plate: licensePlate } });
    if (existingVehicle) {
      return { error: "La patente ya está registrada." };
    }

    await prisma.vehicle.create({
      data: { driver_id: driver.id, brand, model, license_plate: licensePlate, capacity }
    });

    revalidatePath('/driver/vehicles');
    return { success: true };
  } catch (error) {
    return { error: "Error interno al registrar el vehículo." };
  }
}

export async function acceptPool(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.role !== "driver") {
      return { error: "No autorizado." };
    }
    const poolId = formData.get('poolId') as string;
    const vehicleId = formData.get('vehicleId') as string;

    const driver = await prisma.driver.findUnique({ where: { clerk_user_id: userId } });
    if (!driver || driver.verification_status !== "APPROVED") {
      return { error: "Cuenta no verificada por el administrador." };
    }

    await prisma.pool.update({
      where: { id: poolId },
      data: { status: "ASSIGNED", driver_id: driver.id, vehicle_id: vehicleId }
    });

    revalidatePath('/driver/marketplace');
    return { success: true };
  } catch (error) {
    return { error: "Error al asignar viaje." };
  }
}

// 🚀 NUEVA: Actualizar Hitos de forma estricta (Punto 6 del flujo)
export async function updateTripMilestone(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;
    const passengerUserId = formData.get("passengerUserId") as string;
    const type = formData.get("type") as "ON_WAY" | "ARRIVED";

    const hitoTexto = type === "ON_WAY" 
      ? "El conductor está en camino a tu ubicación"
      : "El conductor llegó a tu ubicación";

    await prisma.pool.update({
      where: { id: poolId },
      data: {
        target_user_id: passengerUserId,
        hito: hitoTexto,
      },
    });

    revalidatePath(`/driver/pools/${poolId}/active`);
    return { success: true };
  } catch (error) {
    return { error: "No se pudo actualizar el hito operativo." };
  }
}

// 🚀 ACCIÓN 1: Iniciar el viaje y apuntar automáticamente al primer pasajero
export async function startJourney(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;

    // Buscamos los pasajeros ordenados por su orden de recogida
    const passengers = await prisma.operationalManifestSnapshotPassenger.findMany({
      where: { pool_id: poolId },
      orderBy: { pickup_order: "asc" },
    });

    // Si hay pasajeros, tomamos al primero; si no, queda en null
    const firstPassenger = passengers[0] || null;

    await prisma.pool.update({
      where: { id: poolId },
      data: {
        status: "IN_PROGRESS",
        target_user_id: firstPassenger ? firstPassenger.passenger_user_id : null,
        hito: firstPassenger ? "El conductor está en camino a tu ubicación" : null,
      },
    });

    revalidatePath(`/driver/pools/${poolId}/active`);
    return { success: true };
  } catch (error) {
    return { error: "No se pudo iniciar el recorrido." };
  }
}

// 🚀 ACCIÓN 2: Máquina de estados automática para el botón "Siguiente"
export async function advanceTripStep(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;

    const pool = await prisma.pool.findUnique({
      where: { id: poolId },
      include: {
        manifest_passengers: { orderBy: { pickup_order: "asc" } },
      },
    });

    if (!pool) return { error: "Viaje no encontrado." };

    let nextTargetId = pool.target_user_id;
    let nextHito = pool.hito;

    if (pool.hito === "El conductor está en camino a tu ubicación") {
      // ESTADO: El chofer llegó a buscar al pasajero activo
      nextHito = "El conductor llegó a tu ubicación";
    } else if (pool.hito === "El conductor llegó a tu ubicación") {
      // ESTADO: El pasajero ya subió, buscamos quién es el siguiente en la lista
      const currentIndex = pool.manifest_passengers.findIndex(
        (p) => p.passenger_user_id === pool.target_user_id
      );

      const nextPassenger = pool.manifest_passengers[currentIndex + 1];

      if (nextPassenger) {
        // Hay un próximo pasajero en la combi
        nextTargetId = nextPassenger.passenger_user_id;
        nextHito = "El conductor está en camino a tu ubicación";
      } else {
        // No hay más pasajeros, el manifiesto terminó. Vamos al destino final
        nextTargetId = null;
        nextHito = null;
      }
    }

    // Impactamos la actualización en la base de datos de Neon
    await prisma.pool.update({
      where: { id: poolId },
      data: {
        target_user_id: nextTargetId,
        hito: nextHito,
      },
    });

    revalidatePath(`/driver/pools/${poolId}/active`);
    return { success: true };
  } catch (error) {
    return { error: "Error al avanzar al siguiente paso del viaje." };
  }
}

// 🚀 ACCIÓN 3: Finalizar el viaje (COMPLETED)
export async function completeTrip(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;

    await prisma.pool.update({
      where: { id: poolId },
      data: { status: "COMPLETED", target_user_id: null, hito: null },
    });
    
    revalidatePath(`/driver/pools/${poolId}/active`);
    return { success: true };
  } catch (error) {
    return { error: "Error al finalizar el viaje." };
  }
}