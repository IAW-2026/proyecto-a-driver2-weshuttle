import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";

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

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 font-sans text-slate-700">
      <div className="max-w-4xl mx-auto">
        
        {/* Encabezado */}
        <header className="mb-8">
          <Link 
            href="/" 
            className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            &larr; Volver al Panel de Control
          </Link>
          <h1 className="text-3xl font-extrabold text-[#0A192F] mt-3">Historial de Viajes Global</h1>
          <p className="text-sm text-[#4B5563] mt-1">
            Panel de auditoría histórica. Visualiza todas las comisiones de pools finalizadas en la plataforma.
          </p>
        </header>

        {/* Listado de Viajes */}
        <div className="space-y-6">
          {pools.length === 0 ? (
            <div className="bg-white border border-[#D8DADC] p-10 rounded-2xl text-center text-slate-500 italic shadow-sm">
              <span className="text-3xl block mb-2">📭</span>
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
                  className="bg-white border border-[#D8DADC] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {/* Encabezado del viaje */}
                  <div className="bg-[#0A192F] text-white p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Viaje Auditado
                      </span>
                      <h2 className="text-xl font-bold mt-1.5">
                        {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
                      </h2>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-blue-200 capitalize font-medium">{dateStr}</p>
                      <p className="text-sm font-bold text-white mt-0.5">{timeStr} hs</p>
                    </div>
                  </div>

                  {/* Cuerpo del viaje */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Datos del Conductor */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conductor Asignado</h3>
                        {pool.driver ? (
                          <div className="bg-slate-50 border border-[#D8DADC] p-3 rounded-xl space-y-1">
                            <p className="text-sm font-semibold text-slate-800">{pool.driver.full_name?.split(" (")[0]}</p>
                            <p className="text-xs text-slate-500">ID Clerk: <code className="bg-white px-1.5 py-0.5 border rounded">{pool.driver.clerk_user_id}</code></p>
                            {pool.driver.phone && <p className="text-xs text-slate-500">Tel: {pool.driver.phone}</p>}
                          </div>
                        ) : (
                          <p className="text-sm text-red-500 italic">Sin conductor asignado (o eliminado)</p>
                        )}
                      </div>

                      {/* Datos Generales y Vehículo */}
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del Servicio</h3>
                        <p className="text-sm text-slate-600">
                          <strong>ID del Pool:</strong> <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border">{pool.id}</span>
                        </p>
                        <p className="text-sm text-slate-600">
                          <strong>Pasajeros Registrados:</strong> <span className="font-semibold text-slate-800">{pool.current_passengers} / {pool.max_capacity}</span>
                        </p>
                        {pool.vehicle && (
                          <p className="text-sm text-slate-600">
                            <strong>Vehículo:</strong> {pool.vehicle.brand} {pool.vehicle.model} <span className="font-mono text-xs bg-slate-50 px-1.5 py-0.5 rounded border ml-1 uppercase">{pool.vehicle.license_plate}</span>
                          </p>
                        )}
                      </div>

                    </div>

                    {/* Manifiesto de Pasajeros */}
                    <div className="border-t border-[#D8DADC] pt-4">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Manifiesto de Pasajeros Cobrados</h3>
                      {pool.manifest_passengers.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No hay registros de pasajeros para este viaje.</p>
                      ) : (
                        <div className="bg-[#F7F9FB] border border-[#D8DADC] rounded-xl p-3 flex flex-wrap gap-2">
                          {pool.manifest_passengers.map((p) => (
                            <span 
                              key={p.id}
                              className="inline-flex items-center gap-1 bg-white border border-[#D8DADC] px-2.5 py-1 rounded-lg text-xs text-slate-700 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
