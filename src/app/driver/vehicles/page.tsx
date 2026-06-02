export const dynamic = 'force-dynamic';


import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VehicleForm from "./VehicleForm";

export const metadata = {
  title: "Mis Vehículos | WeShuttle Driver",
};

export default async function VehiclesPage() {
  const { userId, sessionClaims } = await auth();

  // Protección estricta de ruta (Solo rol 'driver')
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  // Traemos el conductor y sus vehículos usando Clerk ID
  const driver = await prisma.driver.findUnique({
    where: { clerk_user_id: userId },
    include: { vehicles: true }
  });

  const vehicles = driver?.vehicles || [];

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10 bg-gray-50 min-h-screen">
      
      <div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900">Mis Vehículos</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gestiona la flota de combis o vehículos disponibles para aceptar viajes.
        </p>
      </div>

      {/* Formulario de Alta */}
      <VehicleForm />

      {/* Listado de Vehículos Actuales */}
      <div className="bg-white shadow sm:rounded-lg border border-gray-100">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Vehículos Registrados ({vehicles.length})</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {vehicles.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-500 italic">No tienes vehículos registrados.</li>}
            {vehicles.map((v) => (
              <li key={v.id} className="px-4 py-4 sm:px-6 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="text-sm font-semibold text-indigo-600 truncate">{v.brand} {v.model}</p>
                  <p className="text-sm text-gray-500 mt-1 uppercase tracking-wider font-mono">Patente: {v.license_plate}</p>
                </div>
                <div className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  Capacidad: {v.capacity} pax
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

    </div>
  );
}
