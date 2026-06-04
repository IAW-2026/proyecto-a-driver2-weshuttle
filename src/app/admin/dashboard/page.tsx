import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DriverStatusForm from "./DriverStatusForm";
import Link from "next/link";


export const metadata = {
  title: "Admin Dashboard | WeShuttle",
};

export default async function AdminDashboardPage() {
  const { sessionClaims } = await auth();

  // Protección de ruta a nivel de servidor (Solo rol admin)
  if ((sessionClaims?.role as string | undefined) !== "admin") {
    redirect("/");
  }

  // Fetch seguro usando Prisma (se asume existencia de relaciones 'driver' y 'vehicles')
  const drivers = await prisma.driver.findMany({
    include: {
      vehicles: true,
    }
  }).catch(() => []); // Fallback útil si la base de datos o el schema aún no ha sido migrado

  // Analítica: Tasa de finalización de viajes (Punto 5.2)
  const poolStats = await prisma.pool.groupBy({
    by: ['status'],
    _count: { id: true },
  }).catch(() => []);

  const totalPools = poolStats.reduce((acc, curr) => acc + curr._count.id, 0);
  const completedPools = poolStats.find((s) => s.status === 'COMPLETED')?._count.id || 0;
  const canceledPools = poolStats.find((s) => s.status === 'CANCELED')?._count.id || 0;
  const completionRate = totalPools > 0 ? Math.round((completedPools / totalPools) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-700">
      <div className="max-w-7xl mx-auto">
        {/* Retorno rápido a Inicio */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link 
            href="/" 
            className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            &larr; Volver al Menú Principal
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-white bg-[#0A192F] px-3 py-1.5 rounded-lg shadow-sm">
              📋 Dashboard (Conductores)
            </span>
            <Link
              href="/admin/vehicles"
              className="text-xs font-semibold text-slate-500 hover:text-[#0A192F] bg-white hover:bg-gray-50 border border-[#D8DADC] px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              🚗 Vehículos Registrados
            </Link>
          </div>
        </div>

        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold leading-6 text-[#0A192F]">
              Dashboard Maestro
            </h1>
            <p className="mt-2 text-sm text-[#4B5563]">
              Gestión operativa de conductores y vehículos de la plataforma. Verifica la documentación para habilitar conductores.
            </p>
          </div>
        </div>

        {/* Reportes y Analíticas (Fase 5.2) */}
        <div className="mt-8 mb-8">
          <h2 className="text-lg font-bold leading-6 text-[#0A192F] mb-4">Resumen Analítico</h2>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm sm:p-6 border border-[#D8DADC]">
              <dt className="truncate text-sm font-medium text-[#4B5563]">Total de Viajes (Pools)</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-[#0A192F]">{totalPools}</dd>
            </div>
            <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm sm:p-6 border border-[#D8DADC]">
              <dt className="truncate text-sm font-medium text-[#4B5563]">Completados vs Cancelados</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-[#0A192F]">
                <span className="text-[#10B981]">{completedPools}</span> <span className="text-slate-400 text-lg mx-2">vs</span> <span className="text-[#EF4444]">{canceledPools}</span>
              </dd>
            </div>
            <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm sm:p-6 border border-[#D8DADC]">
              <dt className="truncate text-sm font-medium text-[#4B5563]">Tasa de Finalización</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight text-[#0A192F]">{completionRate}%</dd>
            </div>
          </dl>
        </div>

        <h2 className="text-lg font-bold leading-6 text-[#0A192F] mb-4 mt-10">Directorio de Conductores</h2>
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-sm border border-[#D8DADC] rounded-xl">
                <table className="min-w-full divide-y divide-[#D8DADC]">
                  <thead className="bg-[#F7F9FB]">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-[#0A192F] sm:pl-6">Conductor</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">ID (Clerk)</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">Vehículos Registrados</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">Estado de Verificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8DADC] bg-white">
                    {drivers.length > 0 ? (
                      drivers.map((driver: any) => (
                        <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{driver.full_name || 'Sin nombre'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><span className="truncate max-w-[120px] inline-block font-mono">{driver.clerk_user_id}</span></td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {driver.vehicles && driver.vehicles.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {driver.vehicles.map((v: any) => (
                                  <li key={v.id}>{v.brand} {v.model} <span className="text-xs text-slate-400">({v.license_plate})</span></li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400 italic">Sin vehículos registrados</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-48">
                            <DriverStatusForm driverId={driver.id} currentStatus={driver.verification_status || 'PENDING'} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="whitespace-nowrap py-8 text-center text-sm text-slate-400 italic">No se encontraron conductores en la base de datos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}