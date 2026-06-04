import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

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
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-[#0A192F] bg-white hover:bg-gray-50 border border-[#D8DADC] px-3 py-1.5 rounded-lg transition-colors shadow-sm"
            >
              📋 Dashboard (Conductores)
            </Link>
            <span className="text-xs font-semibold text-white bg-[#0A192F] px-3 py-1.5 rounded-lg shadow-sm">
              🚗 Vehículos Registrados
            </span>
          </div>
        </div>

        {/* Encabezado Principal */}
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold leading-6 text-[#0A192F]">
              Vehículos Registrados
            </h1>
            <p className="mt-2 text-sm text-[#4B5563]">
              Visualiza, busca y analiza todos los vehículos y combis registradas por los conductores en la plataforma.
            </p>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="mt-6 mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm sm:p-6 border border-[#D8DADC]">
            <dt className="truncate text-sm font-medium text-[#4B5563]">Total de Vehículos Registrados</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-[#0A192F]">
              {totalVehiclesCount}
            </dd>
          </div>
          <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm sm:p-6 border border-[#D8DADC]">
            <dt className="truncate text-sm font-medium text-[#4B5563]">Capacidad Promedio de Flota</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-[#0A192F]">
              {avgCapacity} <span className="text-lg font-normal text-[#4B5563]">pasajeros</span>
            </dd>
          </div>
        </div>

        {/* Formulario de Búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-[#D8DADC] mb-6">
          <form method="GET" className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                name="search"
                defaultValue={search}
                placeholder="Buscar por patente, marca, modelo o conductor..."
                className="w-full rounded-lg border border-[#D8DADC] bg-white py-2 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:border-[#0A192F]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg bg-[#0A192F] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Buscar
              </button>
              {search && (
                <Link
                  href="/admin/vehicles"
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm border border-[#D8DADC] hover:bg-gray-50 transition-colors"
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
              <div className="overflow-hidden shadow-sm border border-[#D8DADC] rounded-xl">
                <table className="min-w-full divide-y divide-[#D8DADC]">
                  <thead className="bg-[#F7F9FB]">
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-[#0A192F] sm:pl-6">
                        Vehículo
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">
                        Patente
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">
                        Capacidad
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">
                        Conductor Asociado
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">
                        Estado
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-bold text-[#0A192F]">
                        Fecha Registro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D8DADC] bg-white">
                    {vehicles.length > 0 ? (
                      vehicles.map((v) => (
                        <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                          {/* Vehículo: Brand + Model */}
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-semibold text-gray-950 sm:pl-6">
                            {v.brand} {v.model}
                          </td>
                          {/* Patente */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className="font-mono text-xs font-bold tracking-wider text-gray-800 bg-gray-100 border border-[#D8DADC] px-2 py-1 rounded-lg">
                              {v.license_plate}
                            </span>
                          </td>
                          {/* Capacidad */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                            {v.capacity} pasajeros
                          </td>
                          {/* Conductor */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                            {v.driver ? (
                              <div>
                                <p className="font-medium text-gray-900">{v.driver.full_name || "Sin nombre registrado"}</p>
                                <p className="text-xs text-gray-400">ID: {v.driver.clerk_user_id}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No asignado</span>
                            )}
                          </td>
                          {/* Estado */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold ${
                              v.status === "ACTIVE" 
                                ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20" 
                                : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20"
                            }`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${v.status === "ACTIVE" ? "bg-green-600" : "bg-red-600"}`} />
                              {v.status}
                            </span>
                          </td>
                          {/* Fecha Registro */}
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(v.createdAt).toLocaleDateString("es-AR")}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="whitespace-nowrap py-8 text-center text-sm text-[#4B5563] italic">
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
