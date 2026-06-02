"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PoolStatus } from "@prisma/client";

const updateStateSchema = z.object({
  poolId: z.string().min(1, "El ID del pool es requerido"),
  status: z.nativeEnum(PoolStatus),
  hito: z.string().nullable().optional(),
});

export async function updatePoolState(prevState: any, formData: FormData): Promise<{ error: string | null; message: string | null }> {
  const hitoRaw = formData.get("hito");
  
  const parsed = updateStateSchema.safeParse({
    poolId: formData.get("poolId"),
    status: formData.get("status"),
    hito: hitoRaw ? String(hitoRaw) : null,
  });

  if (!parsed.success) {
    return { error: "Datos de formulario inválidos.", message: null };
  }

  const { poolId, status, hito } = parsed.data;

  try {
    await prisma.pool.update({
      where: { id: poolId },
      data: {
        status,
        ...(hito !== undefined && { hito }), // update only if provided
      },
    });

    revalidatePath(`/driver/pools/${poolId}/active`);
    return { error: null, message: `Actualizado correctamente a ${status}` };
  } catch (error) {
    console.error("Error updating pool:", error);
    return { error: "Error al actualizar el viaje.", message: null };
  }
}
