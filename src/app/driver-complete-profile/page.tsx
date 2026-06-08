import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import CompleteProfileForm from "./CompleteProfileForm";

export const metadata = {
  title: "Completar Perfil | WeShuttle Driver",
};

export default async function CompleteProfilePage() {
  const { userId, sessionClaims } = await auth();
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  // Buscar si ya existe el conductor en la base de datos
  const driver = await prisma.driver.findUnique({
    where: { clerk_user_id: userId },
  });

  // Si ya tiene todo completado, no hace falta estar acá
  if (driver && driver.full_name && driver.full_name !== "Conductor Nuevo" && driver.phone && driver.phone.trim() !== "") {
    redirect("/driver/marketplace");
  }

  // Pre-llenar con el nombre de Clerk si no tiene uno guardado
  const defaultName = driver?.full_name && driver.full_name !== "Conductor Nuevo"
    ? driver.full_name
    : (sessionClaims as { name?: string })?.name || "";

  const defaultPhone = driver?.phone || "";

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#0A192F]">
          Completa tu Perfil de Conductor
        </h2>
        <p className="mt-2 text-center text-sm text-[#4B5563]">
          Para poder buscar viajes, necesitamos algunos datos básicos sobre ti y tu vehículo.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#D8DADC] rounded-xl sm:px-10">
          <CompleteProfileForm defaultName={defaultName} defaultPhone={defaultPhone} />
        </div>
      </div>
    </div>
  );
}
