import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import TopNavBar from "@/app/components/TopNavBar";

export const metadata = {
  title: "Vehículos Registrados | WeShuttle Admin",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminVehiclesPage({ searchParams }: PageProps) {
  const { sessionClaims } = await auth();

  // 1. Protección de ruta: Solo rol admin
  if ((sessionClaims?.role as string | undefined) !== "admin") {
    redirect("/");
  }

  // 2. Extraer parámetros de búsqueda de forma asíncrona (Next.js 15/16)
  const sp = await searchParams;
  const search = typeof sp.search === "string" ? sp.search.trim() : "";

  // 3. Obtener métricas generales (no filtradas) para las tarjetas de estadísticas
  const allVehicles = await prisma.vehicle.findMany().catch(() => []);
  const totalVehiclesCount = allVehicles.length;
  
  // Capacidad promedio
  const avgCapacity = totalVehiclesCount > 0 
    ? Math.round(allVehicles.reduce((acc, curr) => acc + curr.capacity, 0) / totalVehiclesCount)
    : 0;

  // 4. Consultar vehículos con filtro aplicado si existe
  const whereClause = search
    ? {
        OR: [
          { license_plate: { contains: search, mode: "insensitive" as const } },
          { brand: { contains: search, mode: "insensitive" as const } },
          { model: { contains: search, mode: "insensitive" as const } },
          {
            driver: {
              full_name: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

  const vehicles = await prisma.vehicle.findMany({
    where: whereClause,
    include: {
      driver: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  }).catch(() => []);

  return (
    <div className="min-h-screen bg-[#F7F9FB] font-sans text-slate-700">
      <TopNavBar backUrl="/" backLabel="Menú Principal" />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Quick Navigation sub-bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0A192F]">Vehículos Registrados</h1>
            <p className="text-xs text-[#4B5563] mt-1">
              Visualiza, busca y analiza todos los vehículos y combis registrados.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-[#0A192F] bg-white hover:bg-slate-50 border border-[#D8DADC] px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">badge</span>
              Conductores
            </Link>
            <span className="text-xs font-bold text-[#0A192F] bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-lg shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm font-bold">directions_car</span>
              Vehículos
            </span>
            <Link
              href="/admin/history"
              className="text-xs font-semibold text-slate-600 hover:text-[#0A192F] bg-white hover:bg-slate-50 border border-[#D8DADC] px-3.5 py-2 rounded-lg transition-all shadow-sm flex items-center gap-1.5 uppercase tracking-wider"
            >
              <span className="material-symbols-outlined text-sm">history</span>
              Historial Global
            </Link>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="mt-6 mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          
          <div className="overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">directions_car</span>
            </div>
            <div>
              <dt className="truncate text-xs font-bold uppercase tracking-wider text-[#4B5563]">Total de Vehículos Registrados</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight text-[#0A192F]">
                {totalVehiclesCount}
              </dd>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">airline_seat_recline_normal</span>
            </div>
            <div>
              <dt className="truncate text-xs font-bold uppercase tracking-wider text-[#4B5563]">Capacidad Promedio de Flota</dt>
              <dd className="mt-1 text-2xl font-bold tracking-tight text-[#0A192F]">
                {avgCapacity} <span className="text-sm font-normal text-slate-400">pasajeros</span>
              </dd>
            </div>
          </div>

        </div>

        {/* Formulario de Búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] mb-6">
          <form method="GET" className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400">search</span>
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Buscar por patente, marca, modelo o conductor..."
                className="w-full rounded-lg border border-[#D8DADC] bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:border-[#0A192F]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg bg-[#0A192F] hover:bg-[#111827] px-5 py-2 text-sm font-bold text-white shadow-sm transition-all"
              >
                Buscar
              </button>
              {search && (
                <Link
                  href="/admin/vehicles"
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg bg-white px-5 py-2 text-sm font-bold text-gray-700 shadow-sm border border-[#D8DADC] hover:bg-slate-50 transition-all"
                >
                  Limpiar
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Listado y Tabla */}
        <div className="mt-4 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] border border-[#D8DADC] rounded-xl">
                <table className="min-w-full divide-y divide-[#D8DADC]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 sm:pl-6">
                        Vehículo
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Patente
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Capacidad
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Conductor Asociado
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Estado
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Fecha Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8DADC] bg-white">
                    {vehicles.length > 0 ? (
                      vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                          {/* Vehículo: Brand + Model */}
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-slate-800 sm:pl-6">
                            <span className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-slate-400 text-base">directions_car</span>
                              {v.brand} {v.model}
                            </span>
                          </td>
                          {/* Patente */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className="font-mono text-xs font-bold tracking-wider text-slate-700 bg-slate-50 border border-[#D8DADC] px-2.5 py-1 rounded-lg shadow-sm">
                              {v.license_plate}
                            </span>
                          </td>
                          {/* Capacidad */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600 font-medium">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-slate-400 text-base">airline_seat_recline_normal</span>
                              {v.capacity} pasajeros
                            </span>
                          </td>
                          {/* Conductor */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-600">
                            {v.driver ? (
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <span className="material-symbols-outlined text-sm text-slate-500">person</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800">{v.driver.full_name || "Sin nombre"}</p>
                                  <p className="text-[10px] text-slate-400 font-mono">ID: {v.driver.clerk_user_id.substring(0, 12)}...</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic flex items-center gap-1">
                                <span className="material-symbols-outlined text-base text-slate-300">warning_amber</span>
                                No asignado
                              </span>
                            )}
                          </td>
                          {/* Estado */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                              v.status === "ACTIVE" 
                                ? "bg-green-50 text-green-700 border-green-100" 
                                : "bg-red-50 text-red-700 border-red-100"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${v.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"}`} />
                              {v.status === "ACTIVE" ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          {/* Fecha Registro */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-500 font-mono">
                            {new Date(v.createdAt).toLocaleDateString("es-AR")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="whitespace-nowrap py-8 text-center text-sm text-slate-400 italic">
                          {search 
                            ? "No se encontraron vehículos que coincidan con la búsqueda." 
                            : "No hay vehículos registrados en el sistema."}
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
