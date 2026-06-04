import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { startJourney, advanceTripStep, completeTrip } from "@/app/actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActiveTripPage({ params }: Props) {
  const { id } = await params;

  const pool = await prisma.pool.findUnique({
    where: { id },
    include: { manifest_passengers: { orderBy: { pickup_order: "asc" } } }
  });

  if (!pool) return notFound();

  // Buscamos los datos completos del pasajero al que estamos yendo a buscar actualmente
  const currentTargetPassenger = pool.manifest_passengers.find(
    p => p.passenger_user_id === pool.target_user_id
  );

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 font-sans text-slate-700">
      <div className="max-w-xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <Link 
              href="/driver/marketplace?status=IN_PROGRESS" 
              className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              &larr; Volver al Panel
            </Link>
            <h1 className="text-2xl font-bold text-[#0A192F] mt-2">Viaje en Curso</h1>
            <p className="text-[10px] text-slate-400 font-mono">ID: {pool.id}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${
            pool.status === 'LOCKED' ? 'bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20' : 
            pool.status === 'IN_PROGRESS' ? 'bg-[#EFF6FF] text-[#0A192F] border-blue-100' : 
            'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20'
          }`}>{pool.status}</span>
        </header>

        {/* 📍 DESTINO GLOBAL DE LA COMBI */}
        <div className="border border-[#D8DADC] p-4 rounded-xl bg-white shadow-sm mb-4">
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Destino del Pool</span>
          <p className="text-base font-bold text-[#0A192F] mt-0.5">
            {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
          </p>
        </div>

        {/* 🚀 BOTÓN ÚNICO INTELIGENTE / MÁQUINA DE ESTADOS */}
        <div className="mb-6">
          {pool.status === "LOCKED" && (
            <form action={startJourney as any} className="w-full">
              <input type="hidden" name="poolId" value={pool.id} />
              <button type="submit" className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer">
                🚀 INICIAR RECORRIDO OFICIAL
              </button>
            </form>
          )}

          {pool.status === "IN_PROGRESS" && pool.target_user_id && (
            <form action={advanceTripStep as any} className="w-full">
              <input type="hidden" name="poolId" value={pool.id} />
              {pool.hito === "El conductor está en camino a tu ubicación" ? (
                <button type="submit" className="w-full bg-[#F59E0B] hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer">
                  📍 LLEGUÉ AL PUNTO DE RETIRO
                </button>
              ) : (
                <button type="submit" className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer">
                  ✅ PASAJERO A BORDO → SIGUIENTE
                </button>
              )}
            </form>
          )}

          {pool.status === "IN_PROGRESS" && !pool.target_user_id && (
            <form action={completeTrip as any} className="w-full">
              <input type="hidden" name="poolId" value={pool.id} />
              <button type="submit" className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer">
                🏁 MARCAR VIAJE COMO FINALIZADO
              </button>
            </form>
          )}
        </div>

        {/* 👤 TARJETA DEL PASAJERO OBJETIVO ACTUAL */}
        {pool.status === "IN_PROGRESS" && currentTargetPassenger ? (
          <div className="bg-white border border-[#D8DADC] rounded-xl p-5 shadow-sm mb-6">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[10px] bg-[#EFF6FF] text-[#0A192F] border border-blue-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">Pasajero Activo</span>
                <h2 className="text-xl font-bold text-[#0A192F] mt-1">{currentTargetPassenger.passenger_name}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Hito del Sistema</span>
                <span className="text-xs font-bold text-[#0A192F]">{pool.hito === "El conductor está en camino a tu ubicación" ? "En Camino" : "En la Puerta"}</span>
              </div>
            </div>
            <div className="border-t border-[#D8DADC] pt-3 space-y-2 text-sm text-slate-700">
              <p><strong>📍 Dirección:</strong> {currentTargetPassenger.pickup_address}</p>
              <div className="text-xs bg-[#F7F9FB] p-2.5 rounded-lg border border-[#D8DADC] font-semibold text-slate-600 italic">
                📢 Estado enviado al Pasajero: &quot;{pool.hito}&quot;
              </div>
            </div>
          </div>
        ) : pool.status === "IN_PROGRESS" ? (
          <div className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-xl p-5 text-center shadow-sm mb-6">
            <p className="font-bold text-[#047857] text-base">🙌 ¡Todos los pasajeros están arriba!</p>
            <p className="text-xs text-[#047857] mt-1">Dirígete hacia el nodo industrial asignado para finalizar la comisión.</p>
          </div>
        ) : null}

        {/* 📋 ITINERARIO COMPLETO (CHECKLIST DE SEGUIMIENTO) */}
        <div className="bg-white border border-[#D8DADC] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-[#F7F9FB] border-b border-[#D8DADC]">
            <h3 className="font-bold text-sm text-[#0A192F]">Hoja de Ruta del Manifiesto</h3>
          </div>
          <div className="divide-y divide-[#D8DADC]">
            {pool.manifest_passengers.map((p, index) => {
              const isTarget = pool.target_user_id === p.passenger_user_id;
              
              // Lógica para saber si un pasajero ya quedó atrás en el recorrido
              const currentTargetIndex = pool.manifest_passengers.findIndex(mp => mp.passenger_user_id === pool.target_user_id);
              const isPickedUp = pool.status === "COMPLETED" || (pool.target_user_id === null && pool.status === "IN_PROGRESS") || (currentTargetIndex > index);

              return (
                <div key={p.id} className={`p-3 flex items-center justify-between text-xs transition-colors ${isTarget ? 'bg-[#EFF6FF]/40 font-medium' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border ${
                      isPickedUp ? 'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20' :
                      isTarget ? 'bg-[#0A192F] text-white border-[#0A192F]' : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                      {isPickedUp ? "✓" : index + 1}
                    </span>
                    <div>
                      <p className={isPickedUp ? "line-through text-slate-400" : "text-slate-800 font-medium"}>{p.passenger_name}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[280px]">{p.pickup_address}</p>
                    </div>
                  </div>
                  {isTarget && (
                    <span className="text-[9px] bg-[#0A192F] text-white px-2 py-0.5 rounded-md uppercase font-bold tracking-tight shadow-sm">
                      Actual
                    </span>
                  )}
                  {isPickedUp && (
                    <span className="text-[9px] text-[#10B981] font-bold">
                      A bordo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}