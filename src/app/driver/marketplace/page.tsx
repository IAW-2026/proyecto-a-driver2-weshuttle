import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PoolStatus } from "@prisma/client";

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

  // Verify valid status
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

  const [totalCount, pools] = await prisma.$transaction([
    prisma.pool.count({
      where: { status },
    }),
    prisma.pool.findMany({
      where: { status },
      skip,
      take: pageSize,
      orderBy: { departureTime: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="container mx-auto p-4 max-w-4xl font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-6 text-[#0A192F]">Marketplace de Viajes</h1>
      
      {/* Filters */}
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

      {/* List */}
      <div className="space-y-4">
        {pools.length === 0 ? (
          <div className="p-8 text-center border rounded-lg bg-gray-50 text-gray-500">
            No hay pools con estado {status}.
          </div>
        ) : (
          pools.map((pool) => (
            <div key={pool.id} className="border p-6 rounded-lg shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-lg text-[#0A192F]">Destino: {pool.destinationId}</p>
                <p className="text-gray-600">
                  <span className="font-medium">Salida:</span> {pool.departureTime.toLocaleString("es-AR")}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    pool.status === "AVAILABLE" ? "bg-green-100 text-green-800" :
                    pool.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {pool.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Pasajeros: {pool.currentPassengers} / {pool.maxCapacity}
                  </span>
                </div>
              </div>
              <Link 
                href={`/driver/pools/${pool.id}/active`}
                className="bg-[#0A192F] text-white px-6 py-2 rounded-lg hover:bg-blue-900 transition-colors font-medium whitespace-nowrap"
              >
                Ver Viaje
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          {validPage > 1 ? (
            <Link 
              href={`/driver/marketplace?page=${validPage - 1}&status=${status}`}
              className="px-4 py-2 border rounded hover:bg-gray-50 font-medium"
            >
              Anterior
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded opacity-50 cursor-not-allowed font-medium text-gray-500">
              Anterior
            </span>
          )}
          
          <span className="text-gray-700 font-medium">
            Página {validPage} de {totalPages}
          </span>

          {validPage < totalPages ? (
            <Link 
              href={`/driver/marketplace?page=${validPage + 1}&status=${status}`}
              className="px-4 py-2 border rounded hover:bg-gray-50 font-medium"
            >
              Siguiente
            </Link>
          ) : (
            <span className="px-4 py-2 border rounded opacity-50 cursor-not-allowed font-medium text-gray-500">
              Siguiente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
