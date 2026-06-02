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
    <div className="max-w-xl mx-auto p-4 sm:p-6 font-sans bg-[#F7F9FB] min-h-screen">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <Link href="/driver/marketplace?status=IN_PROGRESS" className="text-xs text-blue-600 hover:underline font-medium">&larr; Volver al Panel</Link>
          <h1 className="text-xl超 font-bold text-slate-900 mt-1">Viaje en Curso</h1>
          <p className="text-[10px] text-gray-400 font-mono">ID: {pool.id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
          pool.status === 'LOCKED' ? 'bg-orange-100 text-orange-800' : 
          pool.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
          'bg-green-100 text-green-800'
        }`}>{pool.status}</span>
      </header>

      {/* 📍 DESTINO GLOBAL DE LA COMBI */}
      <div className="border p-4 rounded-xl bg-white shadow-sm mb-4">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Destino del Pool</span>
        <p className="text-base font-bold text-slate-800 mt-0.5">
          {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
        </p>
      </div>

      {/* 🚀 BOTÓN ÚNICO INTELIGENTE / MÁQUINA DE ESTADOS */}
      <div className="mb-6">
        {pool.status === "LOCKED" && (
          <form action={startJourney as any} className="w-full">
            <input type="hidden" name="poolId" value={pool.id} />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-md text-base transition-all active:scale-[0.98]">
              🚀 INICIAR RECORRIDO OFICIAL
            </button>
          </form>
        )}

        {pool.status === "IN_PROGRESS" && pool.target_user_id && (
          <form action={advanceTripStep as any} className="w-full">
            <input type="hidden" name="poolId" value={pool.id} />
            {pool.hito === "El conductor está en camino a tu ubicación" ? (
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md text-base transition-all active:scale-[0.98]">
                📍 LLEGUÉ AL PUNTO DE RETIRO
              </button>
            ) : (
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-2xl shadow-md text-base transition-all active:scale-[0.98]">
                ✅ PASAJERO A BORDO → SIGUIENTE
              </button>
            )}
          </form>
        )}

        {pool.status === "IN_PROGRESS" && !pool.target_user_id && (
          <form action={completeTrip as any} className="w-full">
            <input type="hidden" name="poolId" value={pool.id} />
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-2xl shadow-md text-base transition-all active:scale-[0.98]">
              🏁 MARCAR VIAJE COMO FINALIZADO
            </button>
          </form>
        )}
      </div>

      {/* 👤 TARJETA DEL PASAJERO OBJETIVO ACTUAL */}
      {pool.status === "IN_PROGRESS" && currentTargetPassenger ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-sm mb-6 ring-2 ring-indigo-600/10">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Pasajero Activo</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{currentTargetPassenger.passenger_name}</h2>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-gray-400 block font-medium">Hito del Sistema</span>
              <span className="text-xs font-semibold text-indigo-600">{pool.hito === "El conductor está en camino a tu ubicación" ? "En Camino" : "En la Puerta"}</span>
            </div>
          </div>
          <div className="border-t pt-3 space-y-2 text-sm text-slate-700">
            <p><strong>📍 Dirección:</strong> {currentTargetPassenger.pickup_address}</p>
            <p className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium text-slate-600 italic">
              📢 Estado enviado al Pasajero: "{pool.hito}"
            </p>
          </div>
        </div>
      ) : pool.status === "IN_PROGRESS" ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center shadow-sm mb-6">
          <p className="font-bold text-green-900 text-base">🙌 ¡Todos los pasajeros están arriba!</p>
          <p className="text-xs text-green-700 mt-1">Dirigite hacia el nodo industrial asignado para finalizar la comisión.</p>
        </div>
      ) : null}

      {/* 📋 ITINERARIO COMPLETO (CHECKLIST DE SEGUIMIENTO) */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50/70 border-b">
          <h3 className="font-bold text-sm text-slate-800">Hoja de Ruta del Manifiesto</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pool.manifest_passengers.map((p, index) => {
            const isTarget = pool.target_user_id === p.passenger_user_id;
            
            // Lógica para saber si un pasajero ya quedó atrás en el recorrido
            const currentTargetIndex = pool.manifest_passengers.findIndex(mp => mp.passenger_user_id === pool.target_user_id);
            const isPickedUp = pool.status === "COMPLETED" || (pool.target_user_id === null && pool.status === "IN_PROGRESS") || (currentTargetIndex > index);

            return (
              <div key={p.id} className={`p-3 flex items-center justify-between text-xs transition-colors ${isTarget ? 'bg-indigo-50/40 font-medium' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${
                    isPickedUp ? 'bg-green-100 text-green-800' :
                    isTarget ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isPickedUp ? "✓" : index + 1}
                  </span>
                  <div>
                    <p className={isPickedUp ? "line-through text-gray-400" : "text-slate-800"}>{p.passenger_name}</p>
                    <p className="text-[10px] text-gray-400 truncate max-w-[280px]">{p.pickup_address}</p>
                  </div>
                </div>
                {isTarget && (
                  <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase font-bold tracking-tight">
                    Actual
                  </span>
                )}
                {isPickedUp && (
                  <span className="text-[9px] text-green-600 font-semibold">
                    A bordo
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}