"use client";
import { useActionState } from "react";
import { updatePoolState } from "./actions";
import { Pool, PoolStatus } from "@prisma/client";

export default function PoolManager({ pool }: { pool: Pool }) {
  const [state, formAction, isPending] = useActionState(updatePoolState, { error: null, message: null });

  const getNextStatus = (current: PoolStatus): PoolStatus | null => {
    switch (current) {
      case "ASSIGNED": return "LOCKED";
      case "LOCKED": return "IN_PROGRESS";
      case "IN_PROGRESS": return "COMPLETED";
      default: return null;
    }
  };

  const nextStatus = getNextStatus(pool.status);
  const isFinished = pool.status === "COMPLETED" || pool.status === "CANCELED";

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
      <h2 className="text-xl font-semibold text-[#0A192F] mb-4">Gestión Operativa</h2>

      {state.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm font-medium border border-red-200">
          {state.error}
        </div>
      )}
      
      {state.message && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-4 text-sm font-medium border border-green-200">
          {state.message}
        </div>
      )}

      <div className="space-y-6">
        {/* Hito form */}
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="poolId" value={pool.id} />
          <input type="hidden" name="status" value={pool.status} />
          
          <label className="text-sm font-medium text-gray-700">Hito Actual (Notificar a pasajeros)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              name="hito" 
              defaultValue={pool.hito || ""}
              placeholder="Ej: En camino al punto de encuentro..." 
              className="border p-2 rounded flex-1 text-sm focus:ring-2 focus:ring-[#0A192F] outline-none"
              disabled={isFinished || isPending}
            />
            <button 
              type="submit" 
              disabled={isFinished || isPending}
              className="bg-[#0A192F] text-white px-4 py-2 rounded text-sm hover:bg-blue-900 disabled:opacity-50 transition-colors"
            >
              Actualizar Hito
            </button>
          </div>
        </form>

        <hr />

        {/* Status transition form */}
        <div className="bg-gray-50 p-4 rounded border">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Transición de Estado</h3>
          {nextStatus ? (
            <form action={formAction} className="flex flex-col gap-2">
              <input type="hidden" name="poolId" value={pool.id} />
              <input type="hidden" name="status" value={nextStatus} />
              <input type="hidden" name="hito" value={pool.hito || ""} />
              
              <p className="text-sm text-gray-500 mb-2">
                Avanzar el estado del viaje de <span className="font-semibold">{pool.status}</span> a <span className="font-semibold">{nextStatus}</span>.
              </p>
              
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Avanzar a {nextStatus}
              </button>
            </form>
          ) : (
            <p className="text-sm text-gray-500">
              {isFinished ? `El viaje está finalizado (${pool.status}).` : "No hay transiciones de estado disponibles."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
