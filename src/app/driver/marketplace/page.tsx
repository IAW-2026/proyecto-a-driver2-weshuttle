import prisma from "@/lib/prisma";
import Link from "next/link";
import { PoolStatus } from "@prisma/client";
import { auth } from "@clerk/nextjs/server";
import { acceptPool } from "@/app/actions";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const statusFilter = typeof sp.status === "string" ? sp.status : "AVAILABLE";

  const pageSize = 5;
  const validPage = isNaN(page) || page < 1 ? 1 : page;

  const validStatuses: PoolStatus[] = [
    "AVAILABLE",
    "ASSIGNED",
    "LOCKED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELED",
  ];
  
  const status = validStatuses.includes(statusFilter as PoolStatus)
    ? (statusFilter as PoolStatus)
    : "AVAILABLE";

  const skip = (validPage - 1) * pageSize;

  // 1. Recuperamos la sesión del conductor autenticado en Clerk
  const { userId } = await auth();
  
  // 2. Buscamos el perfil del conductor local y sus vehículos
  const currentDriver = userId 
    ? await prisma.driver.findUnique({
        where: { clerk_user_id: userId },
        include: { vehicles: { where: { status: "ACTIVE" } } }
      })
    : null;

  // 3. CONSTRUCCIÓN DEL FILTRO DE SEGÚN REGLA DE NEGOCIO
  const whereClause: any = { status };
  
  if (status === "AVAILABLE") {
    whereClause.driver_id = null; // En Marketplace solo se ven viajes huérfanos
  } else {
    whereClause.driver = { clerk_user_id: userId }; // En otras pestañas solo se ven los propios
  }

  // 4. Consulta paginada segura con Prisma
  const [totalCount, pools] = await prisma.$transaction([
    prisma.pool.count({
      where: whereClause,
    }),
    prisma.pool.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { departure_time: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto p-4 max-w-4xl font-[family-name:var(--font-geist-sans)]">
      
      <header className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">&larr; Volver al Inicio</Link>
        <h1 className="text-3xl font-bold mt-2 text-[#0A192F]">Marketplace de Viajes</h1>
        <p className="text-sm text-gray-500 mt-1">Explorá viajes disponibles o gestioná tus pools asignados.</p>
      </header>
      
      {/* Filtros de Estado */}
      <div className="mb-6 flex flex-wrap gap-2">
        {validStatuses.map((s) => (
          <Link
            key={s}
            href={`/driver/marketplace?page=1&status=${s}`}
            className={`px-4 py-2 rounded border text-sm font-medium transition-colors ${
              status === s 
                ? "bg-[#0A192F] text-white border-[#0A192F]" 
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Listado */}
      <div className="space-y-4">
        {pools.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-gray-50 text-gray-500">
            No tienes pools con estado {status}.
          </div>
        ) : (
          pools.map((pool) => (
            <div key={pool.id} className="border p-6 rounded-lg shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-lg text-[#0A192F]">Destino: {pool.destination_id}</p>
                <p className="text-gray-600 text-sm">
                  <span className="font-medium">Salida:</span> {pool.departure_time.toLocaleString("es-AR")}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    pool.status === "AVAILABLE" ? "bg-green-100 text-green-800" :
                    pool.status === "ASSIGNED" ? "bg-indigo-100 text-indigo-800" :
                    pool.status === "LOCKED" ? "bg-orange-100 text-orange-800" :
                    pool.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {pool.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Pasajeros: <strong className="text-slate-800">{pool.current_passengers} / {pool.max_capacity}</strong>
                  </span>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {pool.status === "AVAILABLE" && (
                  <>
                    {currentDriver?.verification_status !== "APPROVED" ? (
                      <span className="text-xs text-orange-600 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg text-center font-medium">
                        🔒 Requiere cuenta verificada
                      </span>
                    ) : !currentDriver.vehicles || currentDriver.vehicles.length === 0 ? (
                      <Link 
                        href="/driver/vehicles" 
                        className="text-xs text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-lg text-center font-medium transition-colors"
                      >
                        🚘 Registrá un vehículo para aceptar
                      </Link>
                    ) : (
                      <form action={acceptPool as any} className="flex flex-col sm:flex-row gap-2 w-full">
  <input type="hidden" name="poolId" value={pool.id} />
  
  <select 
    name="vehicleId" 
    required 
    className="block w-full sm:w-48 text-xs rounded-lg border-gray-200 bg-gray-50 p-2 text-gray-700 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600"
  >
    <option value="">Seleccionar combi...</option>
    {currentDriver.vehicles.map((v) => (
      <option key={v.id} value={v.id}>
        {v.brand} {v.model} ({v.license_plate})
      </option>
    ))}
  </select>

  <button 
    type="submit"
    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-xs font-semibold whitespace-nowrap"
  >
    Aceptar Viaje
  </button>
</form>
                    )}
                  </>
                )}

                {/* Si el viaje es tuyo y ya avanzó de AVAILABLE, te habilita a gestionarlo */}
                {pool.status !== "AVAILABLE" && (
                  <Link 
                    href={`/driver/pools/${pool.id}/active`}
                    className="bg-[#0A192F] text-white px-5 py-2 rounded-lg hover:bg-blue-900 transition-colors text-xs font-medium text-center whitespace-nowrap w-full sm:w-auto"
                  >
                    Ver Recorrido &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {validPage > 1 ? (
            <Link href={`/driver/marketplace?page=${validPage - 1}&status=${status}`} className="px-4 py-2 border rounded hover:bg-gray-50 font-medium text-sm">Anterior</Link>
          ) : (
            <span className="px-4 py-2 border rounded opacity-50 cursor-not-allowed font-medium text-sm text-gray-500">Anterior</span>
          )}
          <span className="text-gray-700 text-sm font-medium">Página {validPage} de {totalPages}</span>
          {validPage < totalPages ? (
            <Link href={`/driver/marketplace?page=${validPage + 1}&status=${status}`} className="px-4 py-2 border rounded hover:bg-gray-50 font-medium text-sm">Siguiente</Link>
          ) : (
            <span className="px-4 py-2 border rounded opacity-50 cursor-not-allowed font-medium text-sm text-gray-500">Siguiente</span>
          )}
        </div>
      )}
    </div>
  );
}