'use client';

import { useTransition, useState, useRef } from "react";
import { registerVehicle, editVehicle, deleteVehicle } from "@/app/actions";
import Link from "next/link";
import Toast from "@/app/components/Toast";

interface Vehicle {
  id: string;
  driver_id: string;
  brand: string;
  model: string;
  license_plate: string;
  capacity: number;
  status: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export default function VehiclesClient({ initialVehicles }: { initialVehicles: Vehicle[] }) {
  const [isPending, startTransition] = useTransition();
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Registrar Vehículo States
  const [registerError, setRegisterError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Editar Vehículo States
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [showConfirmEditModal, setShowConfirmEditModal] = useState(false);
  const [pendingEditData, setPendingEditData] = useState<FormData | null>(null);

  // Eliminar Vehículo States
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);

  // Toast helper
  const addToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Handler: Alta de Vehículo
  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRegisterError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerVehicle(formData);
      if (result?.error) {
        setRegisterError(result.error);
      } else if (result?.success) {
        addToast("Vehículo registrado exitosamente", "success");
        formRef.current?.reset();
      }
    });
  };

  // Handler: Envío de edición (Dispara confirmación)
  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEditError(null);
    if (!editingVehicle) return;

    const formData = new FormData(e.currentTarget);
    formData.append("vehicleId", editingVehicle.id);
    
    // Guardamos la info a enviar y abrimos modal de confirmación
    setPendingEditData(formData);
    setShowConfirmEditModal(true);
  };

  // Handler: Confirmar y Guardar Edición
  const handleConfirmEdit = () => {
    if (!pendingEditData) return;
    setShowConfirmEditModal(false);

    startTransition(async () => {
      const result = await editVehicle(pendingEditData);
      if (result?.error) {
        setEditError(result.error);
      } else if (result?.success) {
        addToast("Cambios guardados", "success");
        setEditingVehicle(null);
        setPendingEditData(null);
      }
    });
  };

  // Handler: Confirmar y Eliminar
  const handleConfirmDelete = () => {
    if (!deletingVehicle) return;
    const formData = new FormData();
    formData.append("vehicleId", deletingVehicle.id);
    setDeletingVehicle(null);

    startTransition(async () => {
      const result = await deleteVehicle(formData);
      if (result?.error) {
        addToast(result.error, "error");
      } else if (result?.success) {
        addToast("Vehículo eliminado exitosamente", "info");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      
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

      <div className="max-w-5xl mx-auto space-y-10">
        
        <div>
          {/* Retorno rápido a Inicio */}
          <Link 
            href="/" 
            className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors mb-4"
          >
            &larr; Volver al Menú Principal
          </Link>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-[#0A192F]">Mis Vehículos</h1>
          <p className="mt-2 text-sm text-[#4B5563]">
            Gestiona la flota de combis o vehículos disponibles para aceptar viajes.
          </p>
        </div>

        {/* Formulario de Alta */}
        <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Registrar Vehículo</h3>
              <p className="mt-1 text-sm text-gray-500">
                Asocia un nuevo vehículo a tu cuenta. Todos los vehículos registrados en la plataforma tienen una capacidad fija de 15 pasajeros.
              </p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <form ref={formRef} onSubmit={handleRegisterSubmit} className="space-y-6">
                
                {registerError && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200 text-sm text-red-600 animate-scale-in">
                    {registerError}
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="brand" className="block text-sm font-medium text-gray-700">Marca</label>
                    <input type="text" name="brand" id="brand" required placeholder="Ej. Mercedes-Benz" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A192F] focus:ring-[#0A192F] sm:text-sm py-2 px-3 border" />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="model" className="block text-sm font-medium text-gray-700">Modelo</label>
                    <input type="text" name="model" id="model" required placeholder="Ej. Sprinter" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A192F] focus:ring-[#0A192F] sm:text-sm py-2 px-3 border" />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="license_plate" className="block text-sm font-medium text-gray-700">Patente (Sin espacios)</label>
                    <input type="text" name="license_plate" id="license_plate" required placeholder="AB123CD" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A192F] focus:ring-[#0A192F] sm:text-sm py-2 px-3 border uppercase" />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-400">Capacidad (Pasajeros)</label>
                    <input type="text" id="capacity" disabled value="15 (Fijo)" className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm sm:text-sm py-2 px-3 border text-gray-500 cursor-not-allowed font-semibold" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="submit" disabled={isPending} className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-[#0A192F] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:ring-offset-2 disabled:opacity-50 transition-colors cursor-pointer">
                    {isPending ? 'Guardando...' : 'Guardar Vehículo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Listado de Vehículos Actuales */}
        <div className="bg-white shadow-sm rounded-xl border border-[#D8DADC] overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-[#0A192F]">Vehículos Registrados ({initialVehicles.length})</h3>
          </div>
          <div className="border-t border-[#D8DADC]">
            <ul role="list" className="divide-y divide-[#D8DADC]">
              {initialVehicles.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500 italic">No tienes vehículos registrados.</li>
              )}
              {initialVehicles.map((v) => (
                <li key={v.id} className="px-4 py-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-[#F7F9FB] transition-colors gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#0A192F] truncate">{v.brand} {v.model}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                        Patente: <span className="bg-gray-100 border border-[#D8DADC] px-2 py-0.5 rounded font-bold text-gray-800">{v.license_plate}</span>
                      </p>
                      <span className="inline-flex items-center rounded-full bg-[#EFF6FF] border border-blue-100 px-2.5 py-0.5 text-xs font-semibold text-[#0A192F]">
                        {v.capacity} pax
                      </span>
                    </div>
                  </div>
                  
                  {/* Acciones del Vehículo */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicle(v);
                        setEditError(null);
                      }}
                      className="px-3 py-1.5 border border-[#D8DADC] rounded-md text-xs font-semibold text-[#0A192F] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingVehicle(v)}
                      className="px-3 py-1.5 border border-red-200 rounded-md text-xs font-semibold text-[#EF4444] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>

      {/* MODAL: EDITAR VEHÍCULO */}
      {editingVehicle && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-xl border border-[#D8DADC] shadow-xl max-w-lg w-full mx-4 overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-[#D8DADC] flex items-center justify-between bg-[#F7F9FB]">
              <h3 className="text-base font-bold text-[#0A192F]">Editar Vehículo</h3>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {editError && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 text-sm text-red-600 animate-scale-in">
                  {editError}
                </div>
              )}
              
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="edit_brand" className="block text-sm font-medium text-gray-700">Marca</label>
                    <input
                      type="text"
                      name="brand"
                      id="edit_brand"
                      required
                      defaultValue={editingVehicle.brand}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A192F] focus:ring-[#0A192F] sm:text-sm py-2 px-3 border"
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="edit_model" className="block text-sm font-medium text-gray-700">Modelo</label>
                    <input
                      type="text"
                      name="model"
                      id="edit_model"
                      required
                      defaultValue={editingVehicle.model}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A192F] focus:ring-[#0A192F] sm:text-sm py-2 px-3 border"
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="edit_license_plate" className="block text-sm font-medium text-gray-700">Patente (Sin espacios)</label>
                    <input
                      type="text"
                      name="license_plate"
                      id="edit_license_plate"
                      required
                      defaultValue={editingVehicle.license_plate}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0A192F] focus:ring-[#0A192F] sm:text-sm py-2 px-3 border uppercase"
                    />
                  </div>
                  
                  <div className="col-span-2 sm:col-span-1">
                    <label htmlFor="edit_capacity" className="block text-sm font-medium text-gray-400">Capacidad (Pasajeros)</label>
                    <input
                      type="text"
                      id="edit_capacity"
                      disabled
                      value="15 (Fijo)"
                      className="mt-1 block w-full rounded-md border-gray-200 bg-gray-50 shadow-sm sm:text-sm py-2 px-3 border text-gray-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-[#D8DADC]">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="px-4 py-2 border border-[#D8DADC] rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-[#0A192F] text-white rounded-md text-sm font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A192F] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {isPending ? 'Procesando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN: GUARDAR EDICIÓN */}
      {showConfirmEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-xl border border-[#D8DADC] shadow-2xl max-w-md w-full mx-4 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-[#0A192F]">
              <span className="text-2xl">📝</span>
              <h3 className="text-lg font-bold text-[#0A192F]">Confirmar cambios</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas guardar las modificaciones realizadas en este vehículo?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmEditModal(false)}
                className="px-4 py-2 border border-[#D8DADC] rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="px-4 py-2 bg-[#0A192F] text-white rounded-md text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Sí, guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMACIÓN: ELIMINAR VEHÍCULO */}
      {deletingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs transition-opacity">
          <div className="bg-white rounded-xl border border-[#D8DADC] shadow-xl max-w-md w-full mx-4 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-[#EF4444]">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-lg font-bold text-[#0A192F]">¿Eliminar vehículo?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar el vehículo <strong className="text-slate-800">{deletingVehicle.brand} {deletingVehicle.model}</strong> (Patente: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{deletingVehicle.license_plate}</span>)? Esta acción no se puede deshacer y el vehículo dejará de estar disponible.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingVehicle(null)}
                className="px-4 py-2 border border-[#D8DADC] rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-[#EF4444] text-white rounded-md text-sm font-medium hover:bg-red-600 transition-colors cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      <div className="fixed bottom-8 right-8 z-[120] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type === "info" ? "info" : toast.type}
            isVisible={true}
            onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="relative pointer-events-auto"
          />
        ))}
      </div>

    </div>
  );
}
