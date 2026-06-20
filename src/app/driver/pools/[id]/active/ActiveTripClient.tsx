'use client';

import { useTransition, useState } from "react";
import { startJourneyFromList, advanceTripStep, completeTrip } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Passenger {
  id: string;
  passenger_name: string;
  pickup_address: string;
  passenger_user_id: string;
  passenger_status: string;
}

interface Pool {
  id: string;
  destination_id: string;
  status: string;
  target_user_id: string | null;
  hito: string | null;
  manifest_passengers: Passenger[];
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface Props {
  pool: Pool;
  currentTargetPassenger: Passenger | null;
}

export default function ActiveTripClient({ pool, currentTargetPassenger }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleStartJourney = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await startJourneyFromList(formData);
      if (result?.error) {
        addToast(result.error, "error");
      } else if (result?.success) {
        addToast("Viaje iniciado exitosamente", "success");
        router.refresh();
      }
    });
  };

  const handleAdvanceStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const isLlegue = pool.hito === "El conductor está en camino a tu ubicación";
    const isFinalLeg = pool.target_user_id === null;

    startTransition(async () => {
      const result = await advanceTripStep(formData);
      if (result?.error) {
        addToast(result.error, "error");
      } else if (result?.success) {
        if (isFinalLeg) {
          addToast("Ruta al destino final iniciada", "success");
        } else if (isLlegue) {
          addToast("Llegada al punto de retiro registrada", "success");
        } else {
          addToast("Pasajero a bordo registrado", "success");
        }
        router.refresh();
      }
    });
  };

  const handleCompleteTrip = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await completeTrip(formData);
      if (result?.error) {
        addToast(result.error, "error");
      } else if (result?.success) {
        addToast("Viaje finalizado exitosamente", "success");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 font-sans text-slate-700">
      
      {/* Animaciones CSS personalizadas */}
      <style jsx global>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>

      <div className="max-w-xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <Link 
              href="/driver/my-trips" 
              className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              &larr; Volver a Mis Viajes
            </Link>
            <h1 className="text-2xl font-bold text-[#0A192F] mt-2">Viaje en Curso</h1>
            <p className="text-[10px] text-slate-400 font-mono">ID: {pool.id}</p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm border ${
            pool.status === 'ASSIGNED' ? 'bg-[#EFF6FF] text-[#0A192F] border-blue-100' :
            pool.status === 'LOCKED' ? 'bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20' : 
            pool.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
            'bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20'
          }`}>
            {pool.status === 'ASSIGNED' ? 'Asignado' :
             pool.status === 'LOCKED' ? 'Confirmado' :
             pool.status === 'IN_PROGRESS' ? 'En Curso' : 'Completado'}
          </span>
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
          {pool.status === "ASSIGNED" && (
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-lg p-4 text-center mb-4">
              <p className="text-xs font-semibold text-[#0A192F]">
                El viaje se confirmará automáticamente 1 hora antes de la salida. Si deseas, puedes iniciar el recorrido ahora mismo.
              </p>
            </div>
          )}

          {(pool.status === "ASSIGNED" || pool.status === "LOCKED") && (
            <form onSubmit={handleStartJourney} className="w-full">
              <input type="hidden" name="poolId" value={pool.id} />
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Procesando..." : "🚀 INICIAR RECORRIDO OFICIAL"}
              </button>
            </form>
          )}

          {pool.status === "IN_PROGRESS" && pool.target_user_id && (
            <form onSubmit={handleAdvanceStep} className="w-full">
              <input type="hidden" name="poolId" value={pool.id} />
              {pool.hito === "El conductor está en camino a tu ubicación" ? (
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-[#F59E0B] hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Procesando..." : "📍 LLEGUÉ AL PUNTO DE RETIRO"}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  {isPending ? "Procesando..." : "✅ PASAJERO A BORDO → SIGUIENTE"}
                </button>
              )}
            </form>
          )}

          {pool.status === "IN_PROGRESS" && !pool.target_user_id && (
            <>
              {pool.hito !== "El conductor está en camino al destino final" ? (
                <form onSubmit={handleAdvanceStep} className="w-full">
                  <input type="hidden" name="poolId" value={pool.id} />
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Procesando..." : "🚐 IR A LA UBICACIÓN FINAL"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteTrip} className="w-full">
                  <input type="hidden" name="poolId" value={pool.id} />
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full bg-[#10B981] hover:bg-emerald-600 text-white font-bold py-4 px-6 rounded-lg shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? "Procesando..." : "🏁 FINALIZAR RECORRIDO"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* 👤 TARJETA DEL PASAJERO OBJETIVO ACTUAL */}
        {pool.status === "IN_PROGRESS" && currentTargetPassenger ? (
          <div className="bg-white border border-[#D8DADC] rounded-xl p-5 shadow-sm mb-6 animate-scale-in">
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
          <div className="bg-[#ECFDF5] border border-[#10B981]/20 rounded-xl p-5 text-center shadow-sm mb-6 animate-scale-in">
            {pool.hito === "El conductor está en camino al destino final" ? (
              <>
                <p className="font-bold text-[#047857] text-base">🚐 Rumbo al Destino Final</p>
                <p className="text-xs text-[#047857] mt-1">
                  Todos los pasajeros están a bordo. Dirígete hacia el parque industrial/puerto para finalizar la comisión.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-[#047857] text-base">🙌 ¡Todos los pasajeros están arriba!</p>
                <p className="text-xs text-[#047857] mt-1">Presiona el botón de arriba para iniciar el tramo al destino final.</p>
              </>
            )}
          </div>
        ) : pool.status === "COMPLETED" ? (
          <div className="bg-emerald-50 border border-[#10B981]/20 rounded-xl p-6 text-center shadow-sm mb-6 animate-scale-in">
            <span className="text-3xl block mb-2">🏁</span>
            <p className="font-bold text-[#047857] text-lg">Viaje Completado con Éxito</p>
            <p className="text-xs text-[#047857] mt-2">
              Los fondos han sido liquidados y se han habilitado las reseñas para los pasajeros.
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-center gap-2">
              <Link 
                href="/driver/marketplace"
                className="px-4 py-2 bg-[#0A192F] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
              >
                Volver a Viajes Disponibles
              </Link>
            </div>
          </div>
        ) : null}

        {/* 📋 ITINERARIO COMPLETO (CHECKLIST DE SEGUIMIENTO) */}
        <div className="bg-white border border-[#D8DADC] rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 bg-[#F7F9FB] border-b border-[#D8DADC] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0A192F]">Hoja de Ruta del Manifiesto</h3>
            <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 border border-[#D8DADC] rounded-full font-bold">
              {pool.manifest_passengers.filter(p => p.passenger_status === "COMPLETED").length} / {pool.manifest_passengers.length} Pasajeros
            </span>
          </div>
          <div className="divide-y divide-[#D8DADC]">
            {pool.manifest_passengers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                🔒 El manifiesto se generará automáticamente al confirmarse el viaje.
              </div>
            ) : (
              pool.manifest_passengers.map((p, index) => {
                const isTarget = pool.target_user_id === p.passenger_user_id;
                const isPickedUp = p.passenger_status === "COMPLETED" || pool.status === "COMPLETED";

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
              })
            )}
          </div>
        </div>
      </div>

      {/* TOAST SYSTEM */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-lg shadow-lg text-white font-medium text-sm border animate-slide-in-right ${
              toast.type === "success" 
                ? "bg-[#10B981] border-emerald-400" 
                : toast.type === "error"
                ? "bg-[#EF4444] border-red-400"
                : "bg-[#0A192F] border-slate-700"
            }`}
          >
            <span className="text-base">
              {toast.type === "success" && "✅"}
              {toast.type === "error" && "⚠️"}
              {toast.type === "info" && "ℹ️"}
            </span>
            <span className="flex-1">{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
