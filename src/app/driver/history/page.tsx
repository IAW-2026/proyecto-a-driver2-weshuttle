import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import TopNavBar from "@/app/components/TopNavBar";
import ExportHistoryButton from "./ExportHistoryButton";

const feedbackAppUrl = process.env.NEXT_PUBLIC_FEEDBACK_APP_URL || "https://proyecto-a-feedback-weshuttle.vercel.app";

export const metadata = {
  title: "Historial de Viajes | WeShuttle Driver",
};

export default async function DriverHistoryPage() {
  const { userId, sessionClaims } = await auth();

  // Protección de ruta
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  const driver = await prisma.driver.findUnique({
    where: { clerk_user_id: userId },
  });

  if (!driver) {
    redirect("/");
  }

  // Obtener viajes COMPLETED asociados a este chofer
  const pools = await prisma.pool.findMany({
    where: {
      driver_id: driver.id,
      status: "COMPLETED",
    },
    include: {
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
    vehicle_plate: pool.vehicle?.license_plate || "N/A",
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-700 flex flex-col">
      <TopNavBar backUrl="/" backLabel="Menú Principal" />

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">

          {/* Encabezado */}
          <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">Historial de Viajes</h1>
              <p className="text-sm text-[#4B5563] mt-1.5">
                Aquí puedes consultar todos tus viajes finalizados y los detalles de las comisiones completadas.
              </p>
            </div>
            <ExportHistoryButton pools={serializedPoolsForExport} />
          </header>

          {/* Listado de Viajes */}
          <div className="space-y-6">
            {pools.length === 0 ? (
              <div className="bg-white border border-[#D8DADC] p-10 rounded-2xl text-center text-slate-500 italic shadow-sm">
                <span className="text-3xl block mb-2">📭</span>
                Aún no has completado ningún viaje en la plataforma.
              </div>
            ) : (
              pools.map((pool) => {
                const dateStr = pool.departure_time.toLocaleDateString("es-AR", {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                });
                const timeStr = pool.departure_time.toLocaleTimeString("en-US", {
                  hour: '2-digit', minute: '2-digit', hour12: true
                });

                return (
                  <div
                    key={pool.id}
                    className="bg-white border border-[#D8DADC] rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Encabezado del viaje */}
                    <div className="bg-gradient-to-r from-[#0A192F] to-[#1B365D] text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20 shadow-sm flex items-center gap-1.5 w-fit">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Viaje Completado
                        </span>
                        <h2 className="text-xl font-bold mt-2.5">
                          {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
                        </h2>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-blue-200 capitalize font-medium">{dateStr}</p>
                        <p className="text-sm font-bold text-white mt-0.5">{timeStr}</p>
                      </div>
                    </div>

                    {/* Cuerpo del viaje */}
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Datos Generales */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos Generales</h3>
                          <p className="text-sm text-slate-600">
                            <strong>ID del Viaje:</strong> <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border">{pool.id}</span>
                          </p>
                          <p className="text-sm text-slate-600 flex items-center gap-1">
                            <strong>Pasajeros Transportados:</strong> <span className="font-semibold text-slate-800">{pool.current_passengers} / {pool.max_capacity}</span>
                          </p>
                        </div>

                        {/* Vehículo Asociado */}
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehículo Utilizado</h3>
                          {pool.vehicle ? (
                            <p className="text-sm text-slate-600">
                              <strong>Unidad:</strong> {pool.vehicle.brand} {pool.vehicle.model} <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border ml-1 uppercase">{pool.vehicle.license_plate}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-red-500 italic">Vehículo no especificado</p>
                          )}
                          <p className="text-sm text-slate-600">
                            <strong>Comisión Liquidada:</strong> <span className="text-emerald-600 font-bold bg-emerald-50 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs">Cobrado</span>
                          </p>
                        </div>

                      </div>

                      {/* Manifiesto de Pasajeros */}
                      <div className="border-t border-[#D8DADC] pt-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Manifiesto de Pasajeros</h3>
                        {pool.manifest_passengers.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No hay pasajeros registrados para este viaje.</p>
                        ) : (
                          <div className="bg-[#F7F9FB] border border-[#D8DADC] rounded-xl p-3 flex flex-wrap gap-2">
                            {pool.manifest_passengers.map((p) => (
                              <span
                                key={p.id}
                                className="inline-flex items-center gap-1.5 bg-white border border-[#D8DADC]/60 px-2.5 py-1.5 rounded-lg text-xs text-slate-700 shadow-sm font-medium"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {p.passenger_name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Footer del viaje con botón Calificar */}
                    <div className="p-4 border-t border-[#D8DADC] flex justify-between items-center bg-[#F8FAFC]">
                      <a
                        href={`${feedbackAppUrl}?pool_id=${pool.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-[#D97706] hover:text-[#B45309] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">star</span>
                        Calificar Pasajeros
                      </a>
                      <span className="text-xs text-slate-400 font-bold">
                        Completado
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
