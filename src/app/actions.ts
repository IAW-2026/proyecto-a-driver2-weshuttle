'use server';

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";

// Esquema estricto de Zod para la validación de servidor
const updateStatusSchema = z.object({
  driverId: z.string().min(1, "El ID del conductor es requerido"),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED'] as const, {
    invalid_type_error: "El estado proporcionado no es válido",
  }),
});

export async function updateDriverVerificationStatus(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const { sessionClaims } = await auth();

  // Protección estricta validando el claim del JWT
  const role = sessionClaims?.role as string | undefined;
  if (role !== "admin") {
    return { error: "No autorizado. Se requiere rol de administrador." };
  }

  const validatedFields = updateStatusSchema.safeParse({
    driverId: formData.get('driverId'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0]?.message || "Datos inválidos" };
  }

  try {
    await prisma.driver.update({
      where: { id: validatedFields.data.driverId },
      data: { verification_status: validatedFields.data.status },
    });

    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("[Admin Dashboard] Error al actualizar estado:", error);
    return { error: "Ocurrió un error en la base de datos al actualizar el estado." };
  }
}