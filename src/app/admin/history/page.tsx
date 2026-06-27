import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import TopNavBar from "@/app/components/TopNavBar";
import ExportHistoryButton from "./ExportHistoryButton";

export const metadata = {
  title: "Historial de Viajes Global | WeShuttle Admin",
};

export default async function AdminHistoryPage() {
  const { userId, sessionClaims } = await auth();

  // Protección de ruta (Solo rol admin)
  if (!userId || sessionClaims?.role !== "admin") {
    redirect("/");
  }

  // Obtener todos los viajes COMPLETED de la plataforma con conductor y vehículo
  const pools = await prisma.pool.findMany({
    where: {
      status: "COMPLETED",
    },
    include: {
      driver: true,
      vehicle: true,
      manifest_passengers: {
        orderBy: {
          pickup_order: "asc",
        },
      },
    },
    orderBy: {
      departure_time: "desc",
    },
  });

  const serializedPoolsForExport = pools.map((pool) => ({
    id: pool.id,
    departure_time: pool.departure_time.toISOString(),
    destination_id: pool.destination_id,
    status: pool.status,
    current_passengers: pool.current_passengers,
    max_capacity: pool.max_capacity,
    driver_name: pool.driver?.full_name || "Sin Conductor",
    vehicle_plate: pool.vehicle?.license_plate || "N/A",
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-700">
      <TopNavBar backUrl="/" backLabel="Menú Principal" />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        
        {/* Quick Navigation sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">Historial de Viajes Global</h1>
            <p className="text-xs text-[#4B5563] mt-1">
              Panel de auditoría histórica. Visualiza todas las comisiones de pools finalizadas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-[#0A192F] bg-white hover:bg-slate-50 border border-[#D8DADC] px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              Conductores
            </Link>
            <Link
              href="/admin/vehicles"
              className="text-xs font-semibold text-slate-600 hover:text-[#0A192F] bg-white hover:bg-slate-50 border border-[#D8DADC] px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">directions_car</span>
              Vehículos
            </Link>
            <span className="text-xs font-bold text-[#0A192F] bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm font-bold">history</span>
              Historial Global
            </span>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <ExportHistoryButton pools={serializedPoolsForExport} />
        </div>

        {/* Listado de Viajes */}
        <div className="space-y-6">
          {pools.length === 0 ? (
            <div className="bg-white border border-[#D8DADC] p-10 rounded-2xl text-center text-slate-500 italic shadow-sm">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">inbox</span>
              No hay viajes completados registrados en la plataforma.
            </div>
          ) : (
            pools.map((pool) => {
              const dateStr = pool.departure_time.toLocaleDateString("es-AR", {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              });
              const timeStr = pool.departure_time.toLocaleTimeString("es-AR", {
                hour: '2-digit', minute: '2-digit'
              });

              return (
                <div 
                  key={pool.id}
                  className="bg-white border border-[#D8DADC] rounded-xl overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] hover:shadow-md transition-all duration-200"
                >
                  {/* Encabezado del viaje */}
                  <div className="border-b border-[#D8DADC] p-4 sm:p-5 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-xs font-bold">check_circle</span>
                        Completado
                      </span>
                      <h2 className="text-lg font-bold text-[#0A192F] mt-1.5 flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">flag</span>
                        {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
                      </h2>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-slate-500 capitalize font-medium flex items-center gap-1 sm:justify-end">
                        <span className="material-symbols-outlined text-xs text-slate-400">calendar_month</span>
                        {dateStr}
                      </p>
                      <p className="text-sm font-bold text-[#0A192F] mt-0.5 flex items-center gap-1 sm:justify-end">
                        <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
                        {timeStr} hs
                      </p>
                    </div>
                  </div>

                  {/* Cuerpo del viaje */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Datos del Conductor */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">badge</span>
                          Conductor Asignado
                        </h3>
                        {pool.driver ? (
                          <div className="bg-slate-50 border border-[#D8DADC] p-3.5 rounded-xl space-y-1.5">
                            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                              {pool.driver.full_name?.split(" (")[0]}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-slate-400">fingerprint</span>
                              ID: <code className="font-mono bg-white px-1.5 py-0.5 border rounded text-slate-600">{pool.driver.clerk_user_id.substring(0, 15)}...</code>
                            </p>
                            {pool.driver.phone && (
                              <p className="text-xs text-slate-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-xs text-slate-400">phone</span>
                                {pool.driver.phone}
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-red-500 italic flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">warning</span>
                            Sin conductor asignado (o eliminado)
                          </p>
                        )}
                      </div>

                      {/* Datos Generales y Vehículo */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          Datos del Servicio
                        </h3>
                        <div className="bg-slate-50 border border-[#D8DADC] p-3.5 rounded-xl space-y-1.5 text-sm text-slate-600">
                          <p className="flex items-center justify-between">
                            <span>ID del Pool:</span>
                            <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border text-slate-500">{pool.id.substring(0, 10)}...</span>
                          </p>
                          <p className="flex items-center justify-between">
                            <span>Pasajeros:</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <span className="material-symbols-outlined text-base text-slate-400">group</span>
                              {pool.current_passengers} / {pool.max_capacity}
                            </span>
                          </p>
                          {pool.vehicle && (
                            <p className="flex items-center justify-between gap-2">
                              <span>Vehículo:</span>
                              <span className="font-semibold text-slate-800 flex items-center gap-1 truncate max-w-[180px]">
                                <span className="material-symbols-outlined text-base text-slate-400 shrink-0">directions_car</span>
                                {pool.vehicle.brand} {pool.vehicle.model}
                                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 border rounded uppercase shrink-0 font-bold ml-1 text-slate-500">{pool.vehicle.license_plate}</span>
                              </span>
                            </p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Manifiesto de Pasajeros */}
                    <div className="border-t border-[#D8DADC] pt-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        Manifiesto de Pasajeros Cobrados
                      </h3>
                      {pool.manifest_passengers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay registros de pasajeros para este viaje.</p>
                      ) : (
                        <div className="bg-slate-50 border border-[#D8DADC] rounded-xl p-3 flex flex-wrap gap-2">
                          {pool.manifest_passengers.map((p) => (
                            <span 
                              key={p.id}
                              className="inline-flex items-center gap-1.5 bg-white border border-[#D8DADC] px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 shadow-sm"
                            >
                              <span className="material-symbols-outlined text-xs text-emerald-500 font-bold">check</span>
                              {p.passenger_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
