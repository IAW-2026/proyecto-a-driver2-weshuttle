'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { triggerCreditAdjustments, getPoolPassengers, precreateReviews, settlePoolFunds, cancelPoolOnRiderApp } from "../../externalApis";
import { z } from "zod";
import { getClerkUserEmail } from "@/lib/clerk-utils";

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
  } catch {
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
    const capacity = 15; // Capacidad fija a 15 pasajeros

    if (!brand || !model || !licensePlate) {
      return { error: "Todos los campos son obligatorios." };
    }
    if (capacity <= 0 || capacity > 15) {
      return { error: "La capacidad máxima permitida es de 15 pasajeros." };
    }
    const plateRegex = /^[A-Z0-9]{6,7}$/;
    if (!plateRegex.test(licensePlate)) {
      return { error: "Patente inválida." };
    }

    const email = await getClerkUserEmail();
    const driver = await prisma.driver.upsert({
      where: { clerk_user_id: userId },
      update: {
        email: email || undefined
      },
      create: { 
        clerk_user_id: userId, 
        email: email || "",
        full_name: "Conductor", 
        status: "ACTIVE", 
        verification_status: "PENDING" 
      }
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
  } catch {
    return { error: "Error interno al registrar el vehículo." };
  }
}

export async function editVehicle(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.role !== "driver") {
      return { error: "No tienes permisos de conductor." };
    }

    const vehicleId = formData.get("vehicleId") as string;
    const brand = formData.get("brand") as string;
    const model = formData.get("model") as string;
    const licensePlate = (formData.get("license_plate") as string).toUpperCase().replace(/\s/g, "");

    if (!vehicleId || !brand || !model || !licensePlate) {
      return { error: "Todos los campos son obligatorios." };
    }

    const plateRegex = /^[A-Z0-9]{6,7}$/;
    if (!plateRegex.test(licensePlate)) {
      return { error: "Patente inválida." };
    }

    const driver = await prisma.driver.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!driver) {
      return { error: "Conductor no registrado." };
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driver_id: driver.id,
        status: "ACTIVE",
      },
    });

    if (!vehicle) {
      return { error: "El vehículo no existe o no tienes permisos sobre él." };
    }

    const existingVehicle = await prisma.vehicle.findUnique({
      where: { license_plate: licensePlate },
    });

    if (existingVehicle && existingVehicle.id !== vehicleId) {
      return { error: "La patente ya está registrada por otro vehículo." };
    }

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { brand, model, license_plate: licensePlate },
    });

    revalidatePath("/driver/vehicles");
    return { success: true };
  } catch (err) {
    console.error("Error al editar vehículo:", err);
    return { error: "Error interno al editar el vehículo." };
  }
}

export async function deleteVehicle(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.role !== "driver") {
      return { error: "No tienes permisos de conductor." };
    }

    const vehicleId = formData.get("vehicleId") as string;
    if (!vehicleId) {
      return { error: "ID de vehículo requerido." };
    }

    const driver = await prisma.driver.findUnique({
      where: { clerk_user_id: userId },
    });

    if (!driver) {
      return { error: "Conductor no registrado." };
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        driver_id: driver.id,
        status: "ACTIVE",
      },
    });

    if (!vehicle) {
      return { error: "El vehículo no existe o no tienes permisos sobre él." };
    }

    // Soft-delete: Cambiar status a INACTIVE y renombrar patente para liberar la patente original
    const inactivePlate = `${vehicle.license_plate}-DEL-${Date.now()}`;

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: "INACTIVE",
        license_plate: inactivePlate,
      },
    });

    revalidatePath("/driver/vehicles");
    return { success: true };
  } catch (err) {
    console.error("Error al eliminar vehículo:", err);
    return { error: "Error interno al eliminar el vehículo." };
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
  } catch {
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
  } catch {
    return { error: "No se pudo actualizar el hito operativo." };
  }
}

// 🚀 ACCIÓN 1: Iniciar el viaje y apuntar automáticamente al primer pasajero
export async function startJourney(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;
    const { userId } = await auth();

    if (userId) {
      // Notificar a Feedback App para que precree las reseñas del viaje
      await precreateReviews(poolId, userId, new Date().toISOString());
    }

    // Inicializamos todos los pasajeros del pool en estado PENDING para reiniciar el recorrido limpio
    await prisma.operationalManifestSnapshotPassenger.updateMany({
      where: { pool_id: poolId },
      data: { passenger_status: "PENDING" }
    });

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
  } catch (err) {
    console.error("Error al iniciar el recorrido:", err);
    return { error: "No se pudo iniciar el recorrido." };
  }
}

export async function startJourneyFromList(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;
    if (!poolId) return { error: "ID de pool requerido." };

    const pool = await prisma.pool.findUnique({ where: { id: poolId } });
    if (!pool) return { error: "Pool no encontrado." };

    // Si el viaje aún está en estado ASSIGNED, lo bloqueamos primero
    if (pool.status === "ASSIGNED") {
      await autoLockPool(poolId);
    }

    // Iniciamos el viaje
    const result = await startJourney(formData);
    return result;
  } catch (err) {
    console.error("Error al iniciar el viaje desde la lista:", err);
    return { error: "No se pudo iniciar el viaje." };
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

    if (pool.status === "IN_PROGRESS" && pool.target_user_id === null && (!pool.hito || pool.hito === "")) {
      // Caso especial: todos los pasajeros ya están a bordo, y el conductor inicia el viaje al destino final
      nextHito = "El conductor está en camino al destino final";
    } else if (pool.hito === "El conductor está en camino a tu ubicación") {
      // ESTADO: El chofer llegó a buscar al pasajero activo
      nextHito = "El conductor llegó a tu ubicación";
    } else if (pool.hito === "El conductor llegó a tu ubicación") {
      // ESTADO: El pasajero ya subió, lo marcamos como COMPLETED y buscamos quién es el siguiente en la lista
      
      const currentPassenger = pool.manifest_passengers.find(
        (p) => p.passenger_user_id === pool.target_user_id
      );

      if (currentPassenger) {
        await prisma.operationalManifestSnapshotPassenger.update({
          where: {
            pool_id_reservation_id: {
              pool_id: poolId,
              reservation_id: currentPassenger.reservation_id
            }
          },
          data: {
            passenger_status: "COMPLETED"
          }
        });
      }

      const currentIndex = pool.manifest_passengers.findIndex(
        (p) => p.passenger_user_id === pool.target_user_id
      );

      const nextPassenger = pool.manifest_passengers[currentIndex + 1];

      if (nextPassenger) {
        // Hay un próximo pasajero en la combi
        nextTargetId = nextPassenger.passenger_user_id;
        nextHito = "El conductor está en camino a tu ubicación";
      } else {
        // No hay más pasajeros, el manifiesto de recogida terminó. Dejamos en null para habilitar ir al destino final
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
  } catch (err) {
    console.error("Error al avanzar paso del viaje:", err);
    return { error: "Error al avanzar al siguiente paso del viaje." };
  }
}

// 🚀 ACCIÓN 3: Finalizar el viaje (COMPLETED)
export async function completeTrip(formData: FormData) {
  try {
    const poolId = formData.get("poolId") as string;
    const { userId } = await auth();

    if (userId) {
      // Liquidar fondos al conductor en Payments App
      await settlePoolFunds(poolId, userId, new Date().toISOString());
    }

    await prisma.pool.update({
      where: { id: poolId },
      data: { status: "COMPLETED", target_user_id: null, hito: null },
    });
    
    revalidatePath(`/driver/pools/${poolId}/active`);
    return { success: true };
  } catch (err) {
    console.error("Error al finalizar el viaje:", err);
    return { error: "Error al finalizar el viaje." };
  }
}

export async function autoLockPool(poolId: string) {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw new Error("Pool no encontrado.");
  if (pool.status !== "ASSIGNED") return;

  // 🔒 RESTRICT AUTO-LOCK: Bloquear únicamente si falta 1 hora o menos para la salida (departure_time)
  // Deshabilitado temporalmente para permitir simulación y pruebas del usuario a cualquier hora
  /*
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  if (pool.departure_time > oneHourFromNow) {
    return; // Aún no es hora de bloquear el pool
  }
  */

  // 1. Llamar a Payments App para iniciar el cálculo de ajustes de crédito (credit-adjustments)
  await triggerCreditAdjustments(poolId, "POOL_LOCKED", pool.departure_time.toISOString(), pool.current_passengers);

  // 2. Obtener el manifiesto final de pasajeros pagados (PAID) desde la Rider App
  const manifestResponse = await getPoolPassengers(poolId, "PAID");

  // 3. Consolidar localmente en OperationalManifestSnapshotPassenger
  // Eliminar previos por consistencia
  await prisma.operationalManifestSnapshotPassenger.deleteMany({
    where: { pool_id: poolId }
  });

  if (manifestResponse && manifestResponse.passengers && manifestResponse.passengers.length > 0) {
    await prisma.operationalManifestSnapshotPassenger.createMany({
      data: manifestResponse.passengers.map((p, idx) => ({
        pool_id: poolId,
        reservation_id: p.reservation_id,
        passenger_user_id: p.passenger_user_id,
        passenger_name: p.passenger_name,
        pickup_address: p.pickup_point.address,
        pickup_lat: p.pickup_point.lat,
        pickup_lng: p.pickup_point.lng,
        pickup_order: idx + 1
      }))
    });
  }

  // 4. Actualizar el estado del pool a LOCKED
  await prisma.pool.update({
    where: { id: poolId },
    data: { status: "LOCKED" }
  });
}

// 🚀 ACCIÓN 4: Cerrar el pool (LOCKED), cobrar reservas y guardar manifiesto local
export async function lockPool(formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.role !== "driver") {
      return { error: "No tienes permisos de conductor." };
    }

    const poolId = formData.get('poolId') as string;
    if (!poolId) return { error: "ID de pool ausente." };

    await autoLockPool(poolId);

    revalidatePath(`/driver/pools/${poolId}/active`);
    return { success: true };
  } catch (error) {
    console.error("Error al cerrar el pool (LOCKED):", error);
    return { error: "Error interno al cerrar el pool y procesar cobros." };
  }
}

const completeProfileSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").max(100),
  phone: z.string().min(6, "El teléfono debe tener al menos 6 caracteres.").max(20),
  brand: z.string().optional(),
  model: z.string().optional(),
  licensePlate: z.string().optional(),
});

export async function completeDriverProfile(prevState: unknown, formData: FormData) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId || sessionClaims?.role !== "driver") {
      return { error: "No autorizado." };
    }

    const fullName = formData.get("fullName") as string;
    const phone = formData.get("phone") as string;
    const brand = (formData.get("brand") as string | null) || "";
    const model = (formData.get("model") as string | null) || "";
    const licensePlateRaw = formData.get("licensePlate") as string | null;
    const licensePlate = licensePlateRaw ? licensePlateRaw.toUpperCase().replace(/\s/g, "") : "";

    // Validación básica con Zod
    const validated = completeProfileSchema.safeParse({
      fullName,
      phone,
      brand: brand || undefined,
      model: model || undefined,
      licensePlate: licensePlate || undefined,
    });

    if (!validated.success) {
      const errorMsg = validated.error.issues.map(e => e.message).join(" ");
      return { error: errorMsg };
    }

    // Si se rellenó al menos un campo del vehículo, se requieren todos
    const hasVehicleInput = !!brand || !!model || !!licensePlate;
    if (hasVehicleInput) {
      if (!brand || !model || !licensePlate) {
        return { error: "Si deseas registrar un vehículo, debes completar Marca, Modelo y Patente." };
      }
      const plateRegex = /^[A-Z0-9]{6,7}$/;
      if (!plateRegex.test(licensePlate)) {
        return { error: "Patente de vehículo inválida (debe ser alfanumérica de 6 o 7 caracteres)." };
      }
    }

    // Actualizar datos del conductor
    const email = await getClerkUserEmail();
    const driver = await prisma.driver.upsert({
      where: { clerk_user_id: userId },
      update: {
        full_name: fullName,
        phone: phone,
        email: email || undefined
      },
      create: {
        clerk_user_id: userId,
        email: email || "",
        full_name: fullName,
        phone: phone,
        status: "ACTIVE",
        verification_status: "PENDING",
      },
    });

    // Si se ingresó un vehículo, crearlo
    if (hasVehicleInput) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { license_plate: licensePlate }
      });
      if (existingVehicle) {
        if (existingVehicle.driver_id !== driver.id) {
          return { error: "La patente ingresada ya está registrada por otro conductor." };
        }
      } else {
        await prisma.vehicle.create({
          data: {
            driver_id: driver.id,
            brand,
            model,
            license_plate: licensePlate,
            capacity: 15,
          }
        });
      }
    }

    revalidatePath("/driver/marketplace");
    revalidatePath("/driver/vehicles");
    return { success: true };
  } catch (err) {
    console.error("Error al completar perfil:", err);
    return { error: "Ocurrió un error interno al registrar tus datos." };
  }
}

export async function checkAndCancelExpiredPools() {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Buscamos pools que sigan AVAILABLE y cuya salida sea en menos de 1 hora (o que ya pasó)
    const expiredPools = await prisma.pool.findMany({
      where: {
        status: "AVAILABLE",
        departure_time: {
          lte: oneHourFromNow
        }
      }
    });

    for (const pool of expiredPools) {
      await prisma.pool.update({
        where: { id: pool.id },
        data: { status: "CANCELED" }
      });

      // Notificar a la Rider App
      await cancelPoolOnRiderApp(
        pool.id,
        "NO_DRIVER_ASSIGNED",
        "El viaje fue cancelado porque no se asignó un conductor antes del horario límite."
      );

      // Notificar a la Payments App
      await triggerCreditAdjustments(
        pool.id,
        "NO_DRIVER_ASSIGNED",
        pool.departure_time.toISOString(),
        pool.current_passengers
      );
    }
  } catch (error) {
    console.error("Error al procesar cancelación automática de pools vencidos:", error);
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    return { error: "No se pudo marcar la notificación como leída." };
  }
}