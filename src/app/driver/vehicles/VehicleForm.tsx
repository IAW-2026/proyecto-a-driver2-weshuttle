'use client';

import { useTransition, useState, useRef } from "react";
import { registerVehicle } from "@/app/actions";

export default function VehicleForm() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerVehicle(formData);
      if (result?.error) {
        setMessage({ error: result.error });
      } else if (result?.success) {
        setMessage({ success: "Vehículo registrado exitosamente." });
        formRef.current?.reset();
      }
    });
  };

  return (
    <div className="bg-white px-4 py-5 shadow sm:rounded-lg sm:p-6 border border-gray-100">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Registrar Vehículo</h3>
          <p className="mt-1 text-sm text-gray-500">
            Asocia un nuevo vehículo a tu cuenta. Todos los vehículos registrados en la plataforma tienen una capacidad fija de 15 pasajeros.
          </p>
        </div>
        <div className="mt-5 md:col-span-2 md:mt-0">
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            
            {message?.error && (
              <div className="bg-red-50 p-4 rounded-md border border-red-200 text-sm text-red-600">
                {message.error}
              </div>
            )}
            
            {message?.success && (
              <div className="bg-green-50 p-4 rounded-md border border-green-200 text-sm text-green-600">
                {message.success}
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
              <button type="submit" disabled={isPending} className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-[#0A192F] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:ring-offset-2 disabled:opacity-50 transition-colors">
                {isPending ? 'Guardando...' : 'Guardar Vehículo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}