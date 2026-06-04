import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import VehicleForm from "./VehicleForm";
import Link from "next/link";

export const metadata = {
  title: "Mis Vehículos | WeShuttle Driver",
};

export default async function VehiclesPage() {
  const { userId, sessionClaims } = await auth();

  // Protección estricta de ruta (Solo usuarios con rol 'driver')
  if (!userId || sessionClaims?.role !== "driver") {
    redirect("/");
  }

  // 🚀 AUTO-REGISTRO EN PRIMER LOGIN (Exigido por la especificación de Usuarios Compartidos)
  const driver = await prisma.driver.upsert({
    where: { clerk_user_id: userId },
    update: {}, // Si el perfil ya existe en Neon, no altera ningún dato operativo
    create: {
      clerk_user_id: userId,
      full_name: (sessionClaims as any).name || "Conductor Nuevo",
      phone: "",
      status: "ACTIVE",
      verification_status: "PENDING", // Nace pendiente para ser aprobado desde el dashboard de Admin
    },
    include: { 
      vehicles: { 
        where: { status: "ACTIVE" } // Filtramos solo los vehículos activos para mantener consistencia
      } 
    }
  });

  // Al usar upsert, garantizamos que 'driver' nunca es null y 'vehicles' siempre es un array seguro
  const vehicles = driver.vehicles;

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
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
        <VehicleForm />

        {/* Listado de Vehículos Actuales */}
        <div className="bg-white shadow-sm rounded-xl border border-[#D8DADC] overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-[#0A192F]">Vehículos Registrados ({vehicles.length})</h3>
          </div>
          <div className="border-t border-[#D8DADC]">
            <ul role="list" className="divide-y divide-[#D8DADC]">
              {vehicles.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500 italic">No tienes vehículos registrados.</li>
              )}
              {vehicles.map((v) => (
                <li key={v.id} className="px-4 py-4 sm:px-6 flex justify-between items-center hover:bg-[#F7F9FB] transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-[#0A192F] truncate">{v.brand} {v.model}</p>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-mono">Patente: <span className="bg-gray-100 border border-[#D8DADC] px-2 py-0.5 rounded font-bold text-gray-800">{v.license_plate}</span></p>
                  </div>
                  <div className="inline-flex items-center rounded-full bg-[#EFF6FF] border border-blue-100 px-3 py-1 text-xs font-bold text-[#0A192F]">
                    Capacidad: {v.capacity} pax
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}