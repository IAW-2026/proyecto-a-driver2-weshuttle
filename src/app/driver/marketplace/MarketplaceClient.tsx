'use client';

import { useTransition, useState } from "react";
import { acceptPool } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 font-sans text-slate-700">
      
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

      <div className="container mx-auto max-w-4xl">
        <header className="mb-6">
          <Link href="/" className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors">
            &larr; Volver al Menú Principal
          </Link>
          <h1 className="text-3xl font-bold mt-3 text-[#0A192F]">Viajes Disponibles</h1>
          <p className="text-sm text-[#4B5563] mt-1">Explora y toma servicios de pools que requieran conductor.</p>
        </header>

        {/* Listado de Viajes */}
        <div className="space-y-4">
          {pools.length === 0 ? (
            <div className="p-8 text-center border border-[#D8DADC] rounded-xl bg-white text-slate-500 italic">
              No hay viajes disponibles en este momento. Vuelve a consultar más tarde.
            </div>
          ) : (
            pools.map((pool) => (
              <div key={pool.id} className="border border-[#D8DADC] p-6 rounded-xl shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-scale-in">
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-lg text-[#0A192F]">
                    Destino: {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}
                  </p>
                  <p className="text-slate-600 text-sm">
                    <span className="font-medium">Salida:</span> {new Date(pool.departure_time).toLocaleString("es-AR")}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full border bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20">
                      Disponible
                    </span>
                    <span className="text-xs text-slate-500">
                      Pasajeros: <strong className="text-slate-800">{pool.current_passengers} / {pool.max_capacity}</strong>
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {(!currentDriver || currentDriver.verification_status !== "APPROVED") ? (
                    <span className="text-xs text-[#B45309] bg-[#FFFBEB] border border-[#F59E0B]/20 px-3 py-2 rounded-lg text-center font-bold">
                      🔒 Requiere cuenta verificada por Admin
                    </span>
                  ) : (!currentDriver.vehicles || currentDriver.vehicles.length === 0) ? (
                    <Link 
                      href="/driver/vehicles" 
                      className="text-xs text-indigo-700 bg-[#EFF6FF] border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-lg text-center font-bold transition-colors"
                    >
                      🚘 Registra un vehículo para aceptar
                    </Link>
                  ) : (
                    <form onSubmit={handleAcceptSubmit} className="flex flex-col sm:flex-row gap-2 w-full">
                      <input type="hidden" name="poolId" value={pool.id} />
                      <select 
                        name="vehicleId" 
                        required 
                        disabled={isPending}
                        className="block w-full sm:w-48 text-xs rounded-lg border border-[#D8DADC] bg-white p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:border-[#0A192F] disabled:opacity-50"
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
                        className="bg-[#0A192F] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        {isPending ? "Tomando..." : "Tomar Viaje"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Paginación */}
        {totalPages > 0 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            {validPage > 1 ? (
              <Link href={`/driver/marketplace?page=${validPage - 1}`} className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white hover:bg-gray-50 font-semibold text-sm transition-colors text-slate-700">Anterior</Link>
            ) : (
              <span className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white opacity-50 cursor-not-allowed font-semibold text-sm text-slate-400">Anterior</span>
            )}
            <span className="text-slate-700 text-sm font-semibold">Página {validPage} de {totalPages}</span>
            {validPage < totalPages ? (
              <Link href={`/driver/marketplace?page=${validPage + 1}`} className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white hover:bg-gray-50 font-semibold text-sm transition-colors text-slate-700">Siguiente</Link>
            ) : (
              <span className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white opacity-50 cursor-not-allowed font-semibold text-sm text-slate-400">Siguiente</span>
            )}
          </div>
        )}
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
