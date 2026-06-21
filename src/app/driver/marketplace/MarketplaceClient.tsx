'use client';

import { useTransition, useState } from "react";
import { acceptPool } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopNavBar from "@/app/components/TopNavBar";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  license_plate: string;
  capacity: number;
}

interface Driver {
  id: string;
  verification_status: string;
  vehicles: Vehicle[];
}

interface PoolPassenger {
  name: string;
  pickup_address: string;
  rating?: number | null;
  total_reviews?: number;
}

interface Pool {
  id: string;
  destination_id: string;
  departure_time: string; // Serialized Date
  status: string;
  current_passengers: number;
  max_capacity: number;
  passengers?: PoolPassenger[];
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface Props {
  pools: Pool[];
  currentDriver: Driver | null;
  validPage: number;
  totalPages: number;
}

export default function MarketplaceClient({
  pools,
  currentDriver,
  validPage,
  totalPages,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [expandedPools, setExpandedPools] = useState<Set<string>>(new Set());

  const toggleExpand = (poolId: string) => {
    setExpandedPools((prev) => {
      const next = new Set(prev);
      if (next.has(poolId)) {
        next.delete(poolId);
      } else {
        next.add(poolId);
      }
      return next;
    });
  };

  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const handleAcceptSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await acceptPool(formData);
      if (result?.error) {
        addToast(result.error, "error");
      } else if (result?.success) {
        addToast("Viaje tomado exitosamente", "success");
        // Refrescar para remover el viaje tomado de la lista
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-700 flex flex-col">
      <TopNavBar backUrl="/" backLabel="Menú Principal" />
      
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

      <main className="flex-1 py-10 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">Viajes Disponibles</h1>
            <p className="text-sm text-[#4B5563] mt-1.5">
              Explora y toma servicios de pools que requieran conductor en la plataforma.
            </p>
          </header>

          {/* Listado de Viajes */}
          <div className="space-y-4">
            {pools.length === 0 ? (
              <div className="p-10 text-center border border-[#D8DADC] rounded-xl bg-white text-slate-500 italic shadow-sm">
                No hay viajes disponibles en este momento. Vuelve a consultar más tarde.
              </div>
            ) : (
              pools.map((pool) => (
                <div key={pool.id} className="border border-[#D8DADC] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] bg-white flex flex-col gap-4 animate-scale-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="space-y-1.5 flex-1">
                      <p className="font-extrabold text-lg text-[#0A192F]">
                        Destino: {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-slate-600 text-sm">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-lg text-slate-400">schedule</span>
                          <span className="font-medium">Salida:</span> {new Date(pool.departure_time).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })} {new Date(pool.departure_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </span>
                        
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-lg text-slate-400">group</span>
                          <span className="font-medium">Pasajeros:</span> <strong className="text-slate-800">{pool.current_passengers} / {pool.max_capacity}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="px-2.5 py-0.5 text-xs font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-500/20 shadow-sm flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Disponible
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => toggleExpand(pool.id)}
                          className="text-xs text-[#0A192F] hover:text-[#4B5563] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {expandedPools.has(pool.id) ? "Ocultar pasajeros ▲" : "Ver pasajeros ▼"}
                        </button>
                      </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {(!currentDriver || currentDriver.verification_status !== "APPROVED") ? (
                        <span className="text-xs text-[#B45309] bg-[#FFFBEB] border border-[#F59E0B]/20 px-3.5 py-2.5 rounded-lg text-center font-bold shadow-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">lock</span>
                          Requiere cuenta verificada por Admin
                        </span>
                      ) : (!currentDriver.vehicles || currentDriver.vehicles.length === 0) ? (
                        <Link 
                          href="/driver/vehicles" 
                          className="text-xs text-indigo-700 bg-[#EFF6FF] border border-blue-200 hover:bg-blue-100 px-4 py-2.5 rounded-lg text-center font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">directions_car</span>
                          Registra un vehículo para aceptar
                        </Link>
                      ) : (
                        <form onSubmit={handleAcceptSubmit} className="flex flex-col sm:flex-row gap-2 w-full items-stretch">
                          <input type="hidden" name="poolId" value={pool.id} />
                          <select 
                            name="vehicleId" 
                            required 
                            disabled={isPending}
                            className="block w-full sm:w-48 text-xs rounded-lg border border-[#D8DADC] bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:border-[#0A192F] disabled:opacity-50 transition-shadow"
                          >
                            <option value="">Seleccionar combi...</option>
                            {currentDriver.vehicles.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.brand} {v.model} ({v.license_plate})
                              </option>
                            ))}
                          </select>
                          <button 
                            type="submit"
                            disabled={isPending}
                            className="bg-[#0A192F] text-white px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-all text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-50 shadow-sm flex items-center justify-center gap-1 active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-xs font-bold">check</span>
                            {isPending ? "Tomando..." : "Tomar Viaje"}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  {expandedPools.has(pool.id) && (
                    <div className="mt-2 pt-4 border-t border-slate-100 w-full animate-scale-in">
                      <h4 className="text-xs font-bold text-[#0A192F] uppercase tracking-wider mb-3">Pasajeros del Pool</h4>
                      {(!pool.passengers || pool.passengers.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No hay pasajeros registrados en este pool.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {pool.passengers.map((pass, idx) => (
                            <div key={idx} className="p-3 bg-[#F7F9FB] rounded-lg border border-[#D8DADC]/60 flex items-center justify-between text-xs animate-scale-in">
                              <div>
                                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                                  {pass.name}
                                  {pass.rating !== undefined && pass.rating !== null ? (
                                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                                      ★ {pass.rating.toFixed(1)}
                                      {pass.total_reviews !== undefined && pass.total_reviews > 0 && (
                                        <span className="text-slate-400 font-normal">({pass.total_reviews})</span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5 shadow-sm">
                                      ★ --
                                    </span>
                                  )}
                                </p>
                                <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                                  {pass.pickup_address}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Paginación */}
          {totalPages > 0 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              {validPage > 1 ? (
                <Link href={`/driver/marketplace?page=${validPage - 1}`} className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white hover:bg-gray-50 font-bold text-xs transition-colors text-slate-700 shadow-sm">Anterior</Link>
              ) : (
                <span className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white opacity-50 cursor-not-allowed font-bold text-xs text-slate-400">Anterior</span>
              )}
              <span className="text-slate-700 text-xs font-bold">Página {validPage} de {totalPages}</span>
              {validPage < totalPages ? (
                <Link href={`/driver/marketplace?page=${validPage + 1}`} className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white hover:bg-gray-50 font-bold text-xs transition-colors text-slate-700 shadow-sm">Siguiente</Link>
              ) : (
                <span className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white opacity-50 cursor-not-allowed font-bold text-xs text-slate-400">Siguiente</span>
              )}
            </div>
          )}
        </div>
      </main>

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
