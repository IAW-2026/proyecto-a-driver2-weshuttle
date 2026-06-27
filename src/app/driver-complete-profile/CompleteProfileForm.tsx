'use client';

import { useActionState, useState } from "react";
import { completeDriverProfile } from "@/app/actions";
import { useRouter } from "next/navigation";

interface Props {
  defaultName: string;
  defaultPhone: string;
}

export default function CompleteProfileForm({ defaultName, defaultPhone }: Props) {
  const router = useRouter();
  const [showVehicle, setShowVehicle] = useState(false);

  // useActionState recibe la acción de servidor, el estado inicial y retorna [state, formAction, isPending]
  const [state, formAction, isPending] = useActionState(
    async (prevState: unknown, formData: FormData) => {
      const result = await completeDriverProfile(prevState, formData);
      if (result?.success) {
        // Redirigir al marketplace al completar con éxito
        if (router && typeof router.push === "function") {
          router.push("/driver/marketplace");
        } else {
          window.location.href = "/driver/marketplace";
        }
      }
      return result;
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-medium">
          ⚠️ {state.error}
        </div>
      )}

      {/* SECCIÓN 1: DATOS OPERATIVOS DEL CHOFER */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-[#0A192F] border-b border-[#D8DADC] pb-2">
          👤 Información Personal
        </h3>

        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={defaultName}
              placeholder="Ej. Juan Pérez"
              className="appearance-none block w-full px-3 py-3 border border-[#D8DADC] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A192F] focus:border-[#0A192F] text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">
            Número de Teléfono / Celular <span className="text-red-500">*</span>
          </label>
          <div className="mt-1">
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              defaultValue={defaultPhone}
              placeholder="Ej. +54 291 4567890"
              className="appearance-none block w-full px-3 py-3 border border-[#D8DADC] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A192F] focus:border-[#0A192F] text-sm"
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: REGISTRO DE VEHÍCULO (OPCIONAL) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#0A192F]">
            🚗 Registro de Vehículo
          </h3>
          <button
            type="button"
            onClick={() => setShowVehicle(!showVehicle)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider cursor-pointer"
          >
            {showVehicle ? "Omitir por ahora" : "Registrar vehículo ahora"}
          </button>
        </div>

        {showVehicle ? (
          <div className="p-4 bg-slate-50 border border-[#D8DADC] rounded-xl space-y-4 transition-all">
            <p className="text-xs text-slate-500 italic">
              ℹ️ Registrar tu vehículo te permitirá comenzar a aceptar viajes de inmediato. Si decides no hacerlo ahora, podrás registrarlo después.
            </p>

            <div>
              <label htmlFor="brand" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Marca <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="brand"
                  name="brand"
                  type="text"
                  required={showVehicle}
                  placeholder="Ej. Mercedes-Benz"
                  className="appearance-none block w-full px-3 py-2.5 border border-[#D8DADC] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A192F] focus:border-[#0A192F] text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="model" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Modelo <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="model"
                  name="model"
                  type="text"
                  required={showVehicle}
                  placeholder="Ej. Sprinter"
                  className="appearance-none block w-full px-3 py-2.5 border border-[#D8DADC] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A192F] focus:border-[#0A192F] text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="licensePlate" className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Patente / Matrícula <span className="text-red-500">*</span>
              </label>
              <div className="mt-1">
                <input
                  id="licensePlate"
                  name="licensePlate"
                  type="text"
                  required={showVehicle}
                  placeholder="Ej. AF123JK"
                  className="appearance-none block w-full px-3 py-2.5 border border-[#D8DADC] rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-[#0A192F] focus:border-[#0A192F] text-sm bg-white"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Capacidad fija: 15 pasajeros. Patente de 6 o 7 caracteres sin espacios.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-yellow-50/50 border border-yellow-100 rounded-xl text-xs text-yellow-800">
            {"⚠️ Omitirás el registro del vehículo. Podrás agregarlo más adelante desde el panel de \"Mis Vehículos\" para poder aceptar pools."}
          </div>
        )}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#0A192F] hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-lg shadow-sm text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-center"
        >
          {isPending ? "Procesando registro..." : "Guardar y Finalizar Registro"}
        </button>
      </div>
    </form>
  );
}
