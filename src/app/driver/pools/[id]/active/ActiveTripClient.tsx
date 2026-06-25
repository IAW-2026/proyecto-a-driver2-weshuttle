'use client';

import { useTransition, useState, useEffect } from "react";
import { startJourneyFromList, advanceTripStep, completeTrip } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopNavBar from "@/app/components/TopNavBar";

interface Passenger {
  id: string;
  passenger_name: string;
  pickup_address: string;
  passenger_user_id: string;
  passenger_status: string;
  rating?: number | null;
  total_reviews?: number;
  pickup_lat?: number;
  pickup_lng?: number;
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
  const [showMap, setShowMap] = useState(false);
  const [expandedPassengerId, setExpandedPassengerId] = useState<string | null>(null);

  const togglePassengerMap = (passengerId: string) => {
    setExpandedPassengerId((prev) => (prev === passengerId ? null : passengerId));
  };

  // Periodic background refresh for real-time updates (passenger status/manifest updates)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 4000);
    return () => clearInterval(interval);
  }, [router]);

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
      } else if (result && 'success' in result) {
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
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-700">
      
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

      <TopNavBar backUrl="/driver/my-trips" backLabel="Mis Viajes" />

      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Detalles del Viaje</span>
            <h1 className="text-2xl font-bold text-[#0A192F] mt-0.5">Viaje en Curso</h1>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {pool.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${
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
        <div className="border border-[#D8DADC] p-4 rounded-xl bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 text-[#0A192F] border border-[#D8DADC] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">flag</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Destino del Pool</span>
            <p className="text-base font-bold text-[#0A192F] mt-0.5">
              {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
            </p>
          </div>
        </div>

        {/* 🚀 BOTÓN ÚNICO INTELIGENTE / MÁQUINA DE ESTADOS */}
        <div className="mb-6">
          {pool.status === "ASSIGNED" && (
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 text-center mb-4">
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
                className="w-full bg-[#0A192F] hover:bg-[#111827] text-white font-bold py-4 px-6 rounded-xl shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">navigation</span>
                {isPending ? "Procesando..." : "INICIAR RECORRIDO OFICIAL"}
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
                  className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold py-4 px-6 rounded-xl shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">pin_drop</span>
                  {isPending ? "Procesando..." : "LLEGUÉ AL PUNTO DE RETIRO"}
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full bg-[#0A192F] hover:bg-[#111827] text-white font-bold py-4 px-6 rounded-xl shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">person_add</span>
                  {isPending ? "Procesando..." : "PASAJERO A BORDO → SIGUIENTE"}
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
                    className="w-full bg-[#0A192F] hover:bg-[#111827] text-white font-bold py-4 px-6 rounded-xl shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">local_shipping</span>
                    {isPending ? "Procesando..." : "IR A LA UBICACIÓN FINAL"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompleteTrip} className="w-full">
                  <input type="hidden" name="poolId" value={pool.id} />
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-4 px-6 rounded-xl shadow-sm text-base transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    {isPending ? "Procesando..." : "FINALIZAR RECORRIDO"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* 👤 TARJETA DEL PASAJERO OBJETIVO ACTUAL */}
        {pool.status === "IN_PROGRESS" && currentTargetPassenger ? (
          <div className="bg-white border border-[#D8DADC] rounded-xl p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] mb-6 animate-scale-in">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl">person</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Pasajero Activo</span>
                  <h2 className="text-lg font-bold text-[#0A192F] mt-0.5 flex items-center gap-1.5">
                    {currentTargetPassenger.passenger_name}
                    {currentTargetPassenger.rating !== undefined && currentTargetPassenger.rating !== null ? (
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                        <span className="material-symbols-outlined text-xs text-amber-500 fill-[1]">star</span>
                        {currentTargetPassenger.rating.toFixed(1)}
                        {currentTargetPassenger.total_reviews !== undefined && currentTargetPassenger.total_reviews > 0 && (
                          <span className="text-slate-400 font-normal">({currentTargetPassenger.total_reviews})</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-xs bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                        <span className="material-symbols-outlined text-xs text-slate-400">star</span>
                        --
                      </span>
                    )}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Estado</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  {pool.hito === "El conductor está en camino a tu ubicación" ? "En Camino" : "En la Puerta"}
                </span>
              </div>
            </div>
            <div className="border-t border-[#D8DADC] pt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-2 text-slate-600">
                <span className="material-symbols-outlined text-lg text-slate-400 shrink-0 mt-0.5">location_on</span>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Dirección de Retiro</span>
                  <p className="text-sm font-semibold text-slate-800">{currentTargetPassenger.pickup_address}</p>
                </div>
              </div>
              <div className="text-xs bg-slate-50 p-3 rounded-lg border border-[#D8DADC] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">
                  <span className="material-symbols-outlined text-xs">campaign</span>
                  Estado enviado al Pasajero
                </div>
                &quot;{pool.hito}&quot;
              </div>

              {/* 🗺️ MAPA DE RETIRO CON OPENSTREETMAP */}
              {currentTargetPassenger.pickup_lat !== undefined && currentTargetPassenger.pickup_lng !== undefined && (
                <div className="pt-2 border-t border-[#D8DADC]/60">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full text-xs border border-[#D8DADC] text-[#0A192F] hover:bg-slate-50 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">{showMap ? "close" : "map"}</span>
                    {showMap ? "Ocultar Mapa de Retiro" : "Mostrar Mapa de Retiro"}
                  </button>

                  {showMap && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[#D8DADC] shadow-sm animate-scale-in">
                      <iframe
                        width="100%"
                        height="250"
                        style={{ border: 0 }}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentTargetPassenger.pickup_lng - 0.003}%2C${currentTargetPassenger.pickup_lat - 0.002}%2C${currentTargetPassenger.pickup_lng + 0.003}%2C${currentTargetPassenger.pickup_lat + 0.002}&layer=mapnik&marker=${currentTargetPassenger.pickup_lat}%2C${currentTargetPassenger.pickup_lng}`}
                      />
                      <div className="bg-slate-50 p-2 text-center border-t border-[#D8DADC] flex justify-center gap-4 text-xs font-semibold">
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${currentTargetPassenger.pickup_lat}&mlon=${currentTargetPassenger.pickup_lng}#map=16/${currentTargetPassenger.pickup_lat}/${currentTargetPassenger.pickup_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0A192F] hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Ver en OpenStreetMap
                        </a>
                        <span className="text-[#D8DADC]">|</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${currentTargetPassenger.pickup_lat},${currentTargetPassenger.pickup_lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">navigation</span>
                          Navegar con Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : pool.status === "IN_PROGRESS" ? (
          <div className="bg-emerald-50 border border-[#10B981]/20 rounded-xl p-5 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] mb-6 animate-scale-in">
            {pool.hito === "El conductor está en camino al destino final" ? (
              <>
                <p className="font-bold text-[#047857] text-base">🚐 Rumbo al Destino Final</p>
                <p className="text-xs text-[#047857]/80 mt-1">
                  Todos los pasajeros están a bordo. Dirígete hacia el destino para finalizar la comisión.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-[#047857] text-base">🙌 ¡Todos los pasajeros están arriba!</p>
                <p className="text-xs text-[#047857]/80 mt-1">Presiona el botón de arriba para iniciar el tramo al destino final.</p>
              </>
            )}
          </div>
        ) : pool.status === "COMPLETED" ? (
          <div className="bg-emerald-50 border border-[#10B981]/20 rounded-xl p-6 text-center shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] mb-6 animate-scale-in">
            <span className="material-symbols-outlined text-4xl text-emerald-600 mb-2">sports_score</span>
            <p className="font-bold text-[#047857] text-lg">Viaje Completado con Éxito</p>
            <p className="text-xs text-[#047857]/80 mt-2">
              Los fondos han sido liquidados y se han habilitado las reseñas para los pasajeros.
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-100 flex justify-center gap-2">
              <Link 
                href="/driver/marketplace"
                className="px-4 py-2 bg-[#0A192F] hover:bg-[#111827] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                Volver a Viajes Disponibles
              </Link>
            </div>
          </div>
        ) : null}

        {/* 📋 ITINERARIO COMPLETO (CHECKLIST DE SEGUIMIENTO) */}
        <div className="bg-white border border-[#D8DADC] rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-[#D8DADC] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#0A192F] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
              Hoja de Ruta del Manifiesto
            </h3>
            <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 border border-[#D8DADC] rounded-full font-bold shadow-sm">
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
                const isMapExpanded = expandedPassengerId === p.id;

                return (
                  <div key={p.id} className={`p-4 flex flex-col gap-2 text-xs transition-colors ${isTarget ? 'bg-[#EFF6FF]/30 font-medium' : ''}`}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold border transition-colors shrink-0 ${
                          isPickedUp ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          isTarget ? 'bg-[#0A192F] text-white border-[#0A192F]' : 'bg-slate-100 text-slate-400 border-slate-200'
                        }`}>
                          {isPickedUp ? (
                            <span className="material-symbols-outlined text-sm font-bold">check</span>
                          ) : index + 1}
                        </span>
                        <div>
                          <p className={`${isPickedUp ? "line-through text-slate-400" : "text-slate-800 font-semibold"} flex items-center gap-1.5`}>
                            {p.passenger_name}
                            {p.rating !== undefined && p.rating !== null ? (
                              <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 py-0.2 rounded-md font-extrabold flex items-center gap-0.5 shadow-sm">
                                ★ {p.rating.toFixed(1)}
                                {p.total_reviews !== undefined && p.total_reviews > 0 && (
                                  <span className="text-slate-400 font-normal">({p.total_reviews})</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1 py-0.2 rounded-md font-extrabold flex items-center gap-0.5 shadow-sm">
                                ★ --
                              </span>
                            )}
                          </p>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">pin_drop</span>
                              {p.pickup_address}
                            </span>
                            {p.pickup_lat !== undefined && p.pickup_lng !== undefined && (
                              <button
                                type="button"
                                onClick={() => togglePassengerMap(p.id)}
                                className="text-[9px] text-[#0A192F] hover:text-[#111827] font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-xs">map</span>
                                {isMapExpanded ? "Ocultar mapa" : "Ver mapa"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isTarget && (
                          <span className="text-[9px] bg-[#0A192F] text-white px-2.5 py-1 rounded-md uppercase font-bold tracking-tight shadow-sm">
                            Actual
                          </span>
                        )}
                        {isPickedUp && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold">
                            A bordo
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 🗺️ MAPA DE CADA PASAJERO DESPLEGABLE */}
                    {isMapExpanded && p.pickup_lat !== undefined && p.pickup_lng !== undefined && (
                      <div className="w-full border border-[#D8DADC] rounded-xl overflow-hidden shadow-sm animate-scale-in">
                        <iframe
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.pickup_lng - 0.003}%2C${p.pickup_lat - 0.002}%2C${p.pickup_lng + 0.003}%2C${p.pickup_lat + 0.002}&layer=mapnik&marker=${p.pickup_lat}%2C${p.pickup_lng}`}
                        />
                        <div className="bg-slate-50 p-1.5 text-center border-t border-[#D8DADC] flex justify-center gap-4 text-[9px] font-semibold">
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${p.pickup_lat}&mlon=${p.pickup_lng}#map=16/${p.pickup_lat}/${p.pickup_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0A192F] hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-xs">open_in_new</span>
                            Ver en OSM
                          </a>
                          <span className="text-[#D8DADC]">|</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${p.pickup_lat},${p.pickup_lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-0.5"
                          >
                            <span className="material-symbols-outlined text-xs">navigation</span>
                            Ver en Google Maps
                          </a>
                        </div>
                      </div>
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
