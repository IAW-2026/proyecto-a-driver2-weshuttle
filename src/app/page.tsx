import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

export default async function HomePage() {
  // Recuperamos la sesión actual del usuario directamente en el servidor
  const { userId, sessionClaims } = await auth();

  // Si no hay un usuario autenticado, lo redirigimos a iniciar sesión
  if (!userId) {
    redirect("/sign-in");
  }

  // Extraemos el rol mapeado desde los Custom Claims de Clerk
  const role = (sessionClaims?.role as string) || null;

  // Si el usuario tiene el rol de conductor, verificamos si su perfil está completo
  if (role === "driver") {
    const driver = await prisma.driver.findUnique({
      where: { clerk_user_id: userId },
    });

    const isProfileIncomplete =
      !driver ||
      !driver.full_name ||
      driver.full_name === "Conductor Nuevo" ||
      !driver.phone ||
      driver.phone.trim() === "";

    if (isProfileIncomplete) {
      redirect("/driver-complete-profile");
    }
  }

  // Separamos las banderas de acceso de manera limpia
  const isDriver = role === "driver";
  const isAdmin = role === "admin";
  const hasAccess = isDriver || isAdmin; // Ambos roles pertenecen al ecosistema de la Driver App

  return (
    <div className="p-8 min-h-screen bg-[#F7F9FB]">
      {/* Encabezado Principal */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#0A192F]">WeShuttle - Conductores</h1>
        <UserButton />
      </header>

      <main>
        {/* Mensaje de Bienvenida Dinámico según el Rol */}
        <p className="text-[#4B5563]">
          {isAdmin
            ? "Bienvenido al panel global de administración."
            : "Bienvenido al panel del conductor."}
        </p>

        {/* Cuadrícula de Accesos Autorizados */}
        {hasAccess && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">

            {/* 1. Viajes Disponibles (Común para Driver y Admin) */}
            <Link
              href="/driver/marketplace"
              className="bg-white p-6 rounded-xl shadow-sm border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group"
            >
              <h3 className="text-xl font-semibold text-[#0A192F] mb-2 group-hover:text-blue-600">Viajes Disponibles &rarr;</h3>
              <p className="text-sm text-gray-500">Busca y acepta nuevos pools disponibles para conducir.</p>
            </Link>

            {/* 2. Vehículos Registrados (EXCLUSIVO para Rol Admin) */}
            {isAdmin && (
              <Link
                href="/admin/vehicles"
                className="bg-white p-6 rounded-xl shadow-sm border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group"
              >
                <h3 className="text-xl font-semibold text-[#0A192F] mb-2 group-hover:text-blue-600">🚗 Vehículos Registrados &rarr;</h3>
                <p className="text-sm text-gray-500">Visualiza todos los vehículos de la plataforma, patentes y sus conductores.</p>
              </Link>
            )}

            {/* 3. Panel de Administración Obligatorio (EXCLUSIVO para Rol Admin) */}
            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="bg-[#EFF6FF] p-6 rounded-xl shadow-sm border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group col-span-1 md:col-span-2 mt-2"
              >
                <h3 className="text-xl font-semibold text-[#0A192F] mb-2 group-hover:text-blue-700">⚙️ Panel de Gestión de Administración &rarr;</h3>
                <p className="text-sm text-slate-600">
                  Control total de datos maestros (conductores y vehículos), auditorías operativas y visualización de reportes analíticos del negocio.
                </p>
              </Link>
            )}

            { //Mostrar mis vehiculos y mis viajes solo para el driver
              isDriver && (
                <>
                  <Link
                    href="/driver/vehicles"
                    className="bg-white p-6 rounded-xl shadow-sm border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group"
                  >
                    <h3 className="text-xl font-semibold text-[#0A192F] mb-2 group-hover:text-blue-600">🚗 Mis Vehículos &rarr;</h3>
                    <p className="text-sm text-gray-500">Gestiona los vehículos registrados en tu cuenta.</p>
                  </Link>
                  <Link
                    href="/driver/my-trips"
                    className="bg-white p-6 rounded-xl shadow-sm border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group"
                  >
                    <h3 className="text-xl font-semibold text-[#0A192F] mb-2 group-hover:text-blue-600">Mis Viajes &rarr;</h3>
                    <p className="text-sm text-gray-500">Consulta y gestiona tus recorridos asignados.</p>
                  </Link>
                </>
              )}


          </div>
        )}

        {/* Control de Bloqueo para Usuarios sin Rol Asignado */}
        {!hasAccess && (
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 max-w-lg">
            <p className="text-yellow-800 text-sm font-medium">
              ⚠️ Tu cuenta no tiene asignado un rol operativo autorizado. Contacta a soporte para verificar tu estado en Clerk.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}