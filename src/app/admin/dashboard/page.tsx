import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DriverStatusForm from "./DriverStatusForm";
import Link from "next/link";
import TopNavBar from "@/app/components/TopNavBar";

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
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-700">
      <TopNavBar backUrl="/" backLabel="Menú Principal" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Quick Navigation sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">Dashboard Maestro</h1>
            <p className="text-xs text-[#4B5563] mt-1">
              Gestión operativa de conductores y vehículos de la plataforma.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0A192F] bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm font-bold">badge</span>
              Conductores
            </span>
            <Link
              href="/admin/vehicles"
              className="text-xs font-semibold text-slate-600 hover:text-[#0A192F] bg-white hover:bg-slate-50 border border-[#D8DADC] px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">directions_car</span>
              Vehículos
            </Link>
            <Link
              href="/admin/history"
              className="text-xs font-semibold text-slate-600 hover:text-[#0A192F] bg-white hover:bg-slate-50 border border-[#D8DADC] px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              Historial Global
            </Link>
          </div>
        </div>

        {/* Reportes y Analíticas (Fase 5.2) */}
        <div className="mt-8 mb-8">
          <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block mb-3">Resumen Analítico</span>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            
            {/* Total Pools Card */}
            <div className="overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">route</span>
              </div>
              <div>
                <dt className="truncate text-xs font-bold uppercase tracking-wider text-[#4B5563]">Total de Viajes</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-[#0A192F]">{totalPools}</dd>
              </div>
            </div>

            {/* Completed vs Canceled Card */}
            <div className="overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <div>
                <dt className="truncate text-xs font-bold uppercase tracking-wider text-[#4B5563]">Completados vs Cancelados</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-[#0A192F] flex items-baseline gap-1">
                  <span className="text-[#10B981]">{completedPools}</span>
                  <span className="text-slate-400 text-sm font-normal mx-1">vs</span>
                  <span className="text-[#EF4444]">{canceledPools}</span>
                </dd>
              </div>
            </div>

            {/* Completion Rate Card */}
            <div className="overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">insights</span>
              </div>
              <div>
                <dt className="truncate text-xs font-bold uppercase tracking-wider text-[#4B5563]">Tasa de Finalización</dt>
                <dd className="mt-1 text-2xl font-bold tracking-tight text-[#0A192F]">{completionRate}%</dd>
              </div>
            </div>

          </dl>
        </div>

        <h2 className="text-lg font-bold leading-6 text-[#0A192F] mb-4 mt-10 flex items-center gap-1.5">
          <span className="material-symbols-outlined">badge</span>
          Directorio de Conductores
        </h2>
        
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] rounded-xl">
                <table className="min-w-full divide-y divide-[#D8DADC]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:pl-6">Conductor</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">ID (Clerk)</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Vehículos Registrados</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">Estado de Verificación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8DADC] bg-white">
                    {drivers.length > 0 ? (
                      drivers.map((driver) => (
                        <tr key={driver.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-slate-800 sm:pl-6">
                            {driver.full_name || 'Sin nombre'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500">
                            <span className="truncate max-w-[120px] inline-block font-mono text-xs bg-slate-50 border border-[#D8DADC] px-2 py-0.5 rounded text-slate-600">
                              {driver.clerk_user_id}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                            {driver.vehicles && driver.vehicles.length > 0 ? (
                              <ul className="space-y-1">
                                {driver.vehicles.map((v) => (
                                  <li key={v.id} className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base text-slate-400">directions_car</span>
                                    <span>{v.brand} {v.model}</span>
                                    <span className="text-xs text-slate-400 bg-slate-50 border border-[#D8DADC] px-1.5 py-0.2 rounded font-mono font-bold">
                                      {v.license_plate}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400 italic flex items-center gap-1">
                                <span className="material-symbols-outlined text-base text-slate-300">warning_amber</span>
                                Sin vehículos registrados
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 w-48">
                            <DriverStatusForm driverId={driver.id} currentStatus={driver.verification_status || 'PENDING'} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="whitespace-nowrap py-8 text-center text-sm text-slate-400 italic">
                          No se encontraron conductores en la base de datos.
                        </td>
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