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
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          {/* 🚀 Enlace de retorno rápido a la raíz */}
            <Link 
              href="/" 
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 uppercase tracking-wider block mb-2"
            >
            &larr; Volver al Menú Principal
           </Link>
          <h1 className="text-3xl font-semibold leading-6 text-slate-900">
            Dashboard Maestro
          </h1>
          <p className="mt-2 text-sm text-slate-700">
            Gestión operativa de conductores y vehículos de la plataforma. Verifica la documentación para habilitar conductores.
          </p>
        </div>
      </div>

      {/* Reportes y Analíticas (Fase 5.2) */}
      <div className="mt-8 mb-8">
        <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4">Resumen Analítico</h2>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
            <dt className="truncate text-sm font-medium text-gray-500">Total de Viajes (Pools)</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{totalPools}</dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
            <dt className="truncate text-sm font-medium text-gray-500">Completados vs Cancelados</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              <span className="text-green-600">{completedPools}</span> <span className="text-gray-400 text-lg mx-2">vs</span> <span className="text-red-600">{canceledPools}</span>
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 border border-gray-100">
            <dt className="truncate text-sm font-medium text-gray-500">Tasa de Finalización</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-indigo-600">{completionRate}%</dd>
          </div>
        </dl>
      </div>

      <h2 className="text-lg font-medium leading-6 text-gray-900 mb-4 mt-10">Directorio de Conductores</h2>
      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Conductor</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">ID (Clerk)</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vehículos Registrados</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Estado de Verificación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {drivers.length > 0 ? (
                    drivers.map((driver: any) => (
                      <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{driver.full_name || 'Sin nombre'}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"><span className="truncate max-w-[120px] inline-block">{driver.clerk_user_id}</span></td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {driver.vehicles && driver.vehicles.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {driver.vehicles.map((v: any) => (
                                <li key={v.id}>{v.brand} {v.model} <span className="text-xs text-gray-400">({v.license_plate})</span></li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic">Sin vehículos registrados</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-48">
                          <DriverStatusForm driverId={driver.id} currentStatus={driver.verification_status || 'PENDING'} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="whitespace-nowrap py-8 text-center text-sm text-gray-500">No se encontraron conductores en la base de datos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}