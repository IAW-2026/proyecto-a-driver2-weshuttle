import { UserButton } from "@clerk/nextjs";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import NotificationsDropdown from "@/app/components/NotificationsDropdown";

export default async function HomePage() {
  // Recuperamos la sesión actual del usuario directamente en el servidor
  const { userId, sessionClaims } = await auth();

  // Si no hay un usuario autenticado, lo redirigimos a iniciar sesión
  if (!userId) {
    redirect("/sign-in");
  }

  const feedbackAppUrl = process.env.NEXT_PUBLIC_FEEDBACK_APP_URL || "https://proyecto-a-feedback-weshuttle.vercel.app";
  const paymentsAppUrl = process.env.NEXT_PUBLIC_PAYMENTS_APP_URL || "https://proyecto-a-payments-weshuttle.vercel.app";

  // Extraemos el rol mapeado desde los Custom Claims de Clerk
  let role = (sessionClaims?.role as string) || null;

  // Si el usuario no tiene rol asignado (nuevo registro), le asignamos "driver" por defecto.
  if (!role) {
    role = "driver";
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          role: "driver",
        },
      });
      console.log(`[Clerk Auto-Role] Asignado rol 'driver' por defecto al usuario ${userId}`);
    } catch (err) {
      console.warn("No se pudo persistir el rol 'driver' en Clerk, continuando con rol local de fallback:", err);
    }
  }

  let displayName = "Usuario";
  const user = await currentUser();

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

    // Limpiamos el nombre de sufijos descriptivos del seed como " (Chofer Verificado)"
    displayName = driver.full_name
      ? driver.full_name.split(" (")[0]
      : (user?.firstName || user?.fullName || "Conductor");
  } else {
    displayName = user?.firstName || user?.fullName || "Administrador";
  }

  // Separamos las banderas de acceso de manera limpia
  const isDriver = role === "driver";
  const isAdmin = role === "admin";
  const hasAccess = isDriver || isAdmin; // Ambos roles pertenecen al ecosistema de la Driver App

  // Cargar notificaciones para el conductor
  const notifications = hasAccess
    ? await prisma.notification.findMany({
      where: {
        driver_user_id: userId,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    : [];

  return (
    <div className="p-8 min-h-screen bg-[#F7F9FB] font-sans">
      <div className="max-w-4xl mx-auto w-full">
        {/* Encabezado Principal */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo-ws-recortado.jpeg"
              alt="WeShuttle Logo"
              className="h-14 w-14 object-contain rounded-lg shadow-sm"
            />
            <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">WeShuttle</h1>
          </div>
          <div className="flex items-center gap-4">
            {hasAccess && (
              <NotificationsDropdown
                initialNotifications={notifications.map((n) => ({
                  id: n.id,
                  pool_id: n.pool_id,
                  message: n.message,
                }))}
                feedbackAppUrl={feedbackAppUrl}
              />
            )}
            <UserButton />
          </div>
        </header>

        <main>
          {/* Banner de Bienvenida Premium */}
          <div className="bg-[#0A192F] text-white p-8 sm:p-10 rounded-2xl shadow-md mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A192F] to-[#1B365D] opacity-60" />
            <div className="flex flex-col gap-1.5 relative z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20 w-fit flex items-center gap-1.5 shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {isAdmin ? "Panel de Control Global" : "Conductor Verificado"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3 text-white leading-tight">
                ¡Bienvenido/a, <span className="text-blue-300 font-bold">{displayName}</span>! 👋
              </h2>
              <p className="text-slate-200/90 text-sm sm:text-base max-w-2xl mt-3 font-medium leading-relaxed">
                Una plataforma inteligente para gestionar vehiculos, tomar viajes y seguir recorridos de manera segura y eficiente.
              </p>
            </div>
          </div>

          {/* Cuadrícula de Accesos Autorizados */}
          {hasAccess && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

              {/* 1. Viajes Disponibles (Común para Driver y Admin) */}
              <Link
                href="/driver/marketplace"
                className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm">
                    <span className="material-symbols-outlined text-xl">local_shipping</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Marketplace</span>
                  <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-600 flex items-center justify-between">
                    Viajes Disponibles
                    <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Busca y acepta nuevos pools disponibles para conducir.
                  </p>
                </div>
              </Link>

              {/* 2. Vehículos Registrados (EXCLUSIVO para Rol Admin) */}
              {isAdmin && (
                <Link
                  href="/admin/vehicles"
                  className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 shadow-sm">
                      <span className="material-symbols-outlined text-xl">airport_shuttle</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Administración</span>
                    <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-600 flex items-center justify-between">
                      Vehículos Registrados
                      <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Visualiza todos los vehículos de la plataforma, patentes y sus conductores.
                    </p>
                  </div>
                </Link>
              )}

              {/* Historial de Viajes Admin (EXCLUSIVO para Rol Admin) */}
              {isAdmin && (
                <Link
                  href="/admin/history"
                  className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600 shadow-sm">
                      <span className="material-symbols-outlined text-xl">receipt_long</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Auditoría</span>
                    <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-600 flex items-center justify-between">
                      Historial de Viajes
                      <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Visualiza el registro histórico de todos los viajes completados en la plataforma.
                    </p>
                  </div>
                </Link>
              )}

              {/* 3. Panel de Administración Obligatorio (EXCLUSIVO para Rol Admin) */}
              {isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group col-span-1 md:col-span-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600 shadow-sm">
                      <span className="material-symbols-outlined text-xl">settings</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Administración</span>
                    <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-700 flex items-center justify-between">
                      Panel de Gestión de Administración
                      <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      Control total de datos maestros (conductores y vehículos), auditorías operativas y visualización de reportes analíticos del negocio.
                    </p>
                  </div>
                </Link>
              )}

              { //Mostrar mis vehiculos y mis viajes solo para el driver
                isDriver && (
                  <>
                    <Link
                      href="/driver/vehicles"
                      className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm">
                          <span className="material-symbols-outlined text-xl">directions_car</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Conductor</span>
                        <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-600 flex items-center justify-between">
                          Mis Vehículos
                          <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Gestiona los vehículos registrados en tu cuenta.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/driver/my-trips"
                      className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 shadow-sm">
                          <span className="material-symbols-outlined text-xl">navigation</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Conductor</span>
                        <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-600 flex items-center justify-between">
                          Mis Viajes
                          <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Consulta y gestiona tus recorridos asignados.
                        </p>
                      </div>
                    </Link>

                    <Link
                      href="/driver/history"
                      className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-rose-50 text-rose-600 shadow-sm">
                          <span className="material-symbols-outlined text-xl">history</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Historial</span>
                        <h3 className="text-lg font-bold text-[#0A192F] mt-1 group-hover:text-blue-600 flex items-center justify-between">
                          Historial de Viajes
                          <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Revisa tu historial de viajes completados y cobros liquidados.
                        </p>
                      </div>
                    </Link>

                    <a
                      href={paymentsAppUrl}
                      className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 shadow-sm">
                          <span className="material-symbols-outlined text-xl">payments</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Finanzas</span>
                        <h3 className="text-lg font-bold text-[#0A192F] group-hover:text-emerald-700 flex items-center justify-between">
                          Ver Cobros y Finanzas
                          <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Consulta tus liquidaciones, saldos y cobros en la Payments App.
                        </p>
                      </div>
                    </a>

                    <a
                      href={feedbackAppUrl}
                      className="bg-white p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#D8DADC] hover:border-[#0A192F] hover:shadow-md transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-600 shadow-sm">
                          <span className="material-symbols-outlined text-xl">star</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 block">Feedback</span>
                        <h3 className="text-lg font-bold text-[#0A192F] group-hover:text-[#B45309] flex items-center justify-between">
                          Calificar Pasajeros
                          <span className="text-slate-300 group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Califica a los pasajeros de tus viajes en la Feedback App.
                        </p>
                      </div>
                    </a>
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
    </div>
  );
}