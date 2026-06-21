'use client';

import { useTransition, useState } from "react";
import { startJourneyFromList } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopNavBar from "@/app/components/TopNavBar";

interface Pool {
  id: string;
  destination_id: string;
  departure_time: string; // Serialized Date
  status: string;
  current_passengers: number;
  max_capacity: number;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function MyTripsClient({ pools }: { pools: Pool[] }) {
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

  const handleStartJourney = (poolId: string) => {
    const formData = new FormData();
    formData.append("poolId", poolId);

    startTransition(async () => {
      const result = await startJourneyFromList(formData);
      if (result?.error) {
        addToast(result.error, "error");
      } else if (result && 'success' in result) {
        addToast("Viaje iniciado con éxito", "success");
        // Redirigir al centro de control del viaje activo
        router.push(`/driver/pools/${poolId}/active`);
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
            <h1 className="text-3xl font-extrabold text-[#0A192F] tracking-tight">Mis Viajes</h1>
            <p className="text-sm text-[#4B5563] mt-1.5">Revisa y administra tus recorridos asignados.</p>
          </header>

          {/* Listado de Viajes Asignados */}
          <div className="space-y-4">
            {pools.length === 0 ? (
              <div className="p-10 text-center border border-[#D8DADC] rounded-xl bg-white text-slate-500 italic shadow-sm">
                No tienes viajes asignados actualmente. Puedes buscar viajes en la sección de Viajes Disponibles.
              </div>
            ) : (
              pools.map((pool) => (
                <div key={pool.id} className="border border-[#D8DADC] p-6 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-scale-in">
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

                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shadow-sm ${
                        pool.status === 'ASSIGNED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        pool.status === 'LOCKED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        pool.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          pool.status === 'ASSIGNED' ? 'bg-blue-500' :
                          pool.status === 'LOCKED' ? 'bg-amber-500' :
                          pool.status === 'IN_PROGRESS' ? 'bg-indigo-500 animate-pulse' :
                          'bg-emerald-500'
                        }`} />
                        {pool.status === 'ASSIGNED' ? 'Asignado' :
                         pool.status === 'LOCKED' ? 'Confirmado' :
                         pool.status === 'IN_PROGRESS' ? 'En Curso' : 'Completado'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Link 
                      href={`/driver/pools/${pool.id}/active`}
                      className="border border-[#D8DADC] text-[#0A192F] hover:bg-slate-50 px-5 py-2.5 rounded-lg transition-all text-xs font-bold text-center whitespace-nowrap w-full sm:w-auto shadow-sm flex items-center justify-center gap-1 active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Ver Recorrido
                    </Link>
                    {pool.status === "IN_PROGRESS" ? (
                      <Link
                        href={`/driver/pools/${pool.id}/active`}
                        className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-lg transition-all text-xs font-bold text-center whitespace-nowrap w-full sm:w-auto shadow-sm flex items-center justify-center gap-1 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-sm animate-pulse">navigation</span>
                        Continuar
                      </Link>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => handleStartJourney(pool.id)}
                        disabled={isPending}
                        className="bg-[#0A192F] text-white hover:bg-slate-800 px-5 py-2.5 rounded-lg transition-all text-xs font-bold text-center whitespace-nowrap w-full sm:w-auto shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1 active:scale-[0.98]"
                      >
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                        {isPending ? "Iniciando..." : "Iniciar"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
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
