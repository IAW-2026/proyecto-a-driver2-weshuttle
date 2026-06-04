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

  // 1. Recuperamos la sesión y los claims del usuario logueado en Clerk
  const { userId, sessionClaims } = await auth();
  
  // 2. 🚀 AUTO-REGISTRO EN PRIMER LOGIN (Exigido por el manual de usuarios)
  let currentDriver = null;
  if (userId && sessionClaims?.role === "driver") {
    currentDriver = await prisma.driver.upsert({
      where: { clerk_user_id: userId },
      update: {}, // Si ya existe, no toca nada
      create: {
        clerk_user_id: userId,
        full_name: (sessionClaims as any).name || "Conductor Nuevo",
        phone: "",
        status: "ACTIVE",
        verification_status: "PENDING", // Nace pendiente para ser aprobado por el Admin
      },
      include: { vehicles: { where: { status: "ACTIVE" } } }
    });
  }

  // 3. CONSTRUCCIÓN DEL FILTRO DE SEGÚN REGLA DE NEGOCIO
  const whereClause: any = { status };
  
  if (status === "AVAILABLE") {
    whereClause.driver_id = null; 
  } else {
    whereClause.driver = { clerk_user_id: userId }; 
  }

  const [totalCount, pools] = await prisma.$transaction([
    prisma.pool.count({ where: whereClause }),
    prisma.pool.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { departure_time: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="min-h-screen bg-[#F7F9FB] py-10 px-4 font-sans text-slate-700">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-6">
          <Link href="/" className="text-xs font-semibold text-[#0A192F] hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition-colors">
            &larr; Volver al Menú Principal
          </Link>
          <h1 className="text-3xl font-bold mt-3 text-[#0A192F]">Marketplace de Viajes</h1>
          <p className="text-sm text-[#4B5563] mt-1">Explora viajes disponibles o gestiona tus pools asignados.</p>
        </header>
        
        {/* Filtros de Estado */}
        <div className="mb-6 flex flex-wrap gap-2">
          {validStatuses.map((s) => (
            <Link
              key={s}
              href={`/driver/marketplace?page=1&status=${s}`}
              className={`px-4 py-2 rounded-lg border text-sm font-semibold shadow-sm transition-colors ${
                status === s 
                  ? "bg-[#0A192F] text-white border-[#0A192F]" 
                  : "bg-white text-slate-700 hover:bg-gray-50 border-[#D8DADC]"
              }`}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>

        {/* Listado de Viajes */}
        <div className="space-y-4">
          {pools.length === 0 ? (
            <div className="p-8 text-center border border-[#D8DADC] rounded-xl bg-white text-slate-500 italic">
              No tienes pools con estado {status}.
            </div>
          ) : (
            pools.map((pool) => (
              <div key={pool.id} className="border border-[#D8DADC] p-6 rounded-xl shadow-sm bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-lg text-[#0A192F]">Destino: {pool.destination_id.replace("dest_", "").replace("_", " ").toUpperCase()}</p>
                  <p className="text-slate-600 text-sm">
                    <span className="font-medium">Salida:</span> {pool.departure_time.toLocaleString("es-AR")}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                      pool.status === "AVAILABLE" ? "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20" :
                      pool.status === "COMPLETED" ? "bg-[#ECFDF5] text-[#10B981] border-[#10B981]/20" :
                      pool.status === "LOCKED" ? "bg-[#FFFBEB] text-[#F59E0B] border-[#F59E0B]/20" :
                      pool.status === "CANCELED" ? "bg-[#FEF2F2] text-[#EF4444] border-[#EF4444]/20" :
                      "bg-[#EFF6FF] text-[#0A192F] border-blue-100"
                    }`}>
                      {pool.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Pasajeros: <strong className="text-slate-800">{pool.current_passengers} / {pool.max_capacity}</strong>
                    </span>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  {pool.status === "AVAILABLE" && (
                    <>
                      {/* 🔒 FIX BLINDAJE: Verificación ultra segura contra nulos */}
                      {(!currentDriver || currentDriver.verification_status !== "APPROVED") ? (
                        <span className="text-xs text-[#B45309] bg-[#FFFBEB] border border-[#F59E0B]/20 px-3 py-2 rounded-lg text-center font-bold">
                          🔒 Requiere cuenta verificada por Admin
                        </span>
                      ) : (!currentDriver.vehicles || currentDriver.vehicles.length === 0) ? (
                        <Link 
                          href="/driver/vehicles" 
                          className="text-xs text-indigo-700 bg-[#EFF6FF] border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-lg text-center font-bold transition-colors"
                        >
                          🚘 Registra un vehículo para aceptar
                        </Link>
                      ) : (
                        <form action={acceptPool as any} className="flex flex-col sm:flex-row gap-2 w-full">
                          <input type="hidden" name="poolId" value={pool.id} />
                          <select 
                            name="vehicleId" 
                            required 
                            className="block w-full sm:w-48 text-xs rounded-lg border border-[#D8DADC] bg-white p-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A192F] focus:border-[#0A192F]"
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
                            className="bg-[#0A192F] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold whitespace-nowrap"
                          >
                            Aceptar Viaje
                          </button>
                        </form>
                      )}
                    </>
                  )}

                  {pool.status !== "AVAILABLE" && (
                    <Link 
                      href={`/driver/pools/${pool.id}/active`}
                      className="bg-[#0A192F] text-white px-5 py-2 rounded-lg hover:bg-slate-800 transition-colors text-xs font-bold text-center whitespace-nowrap w-full sm:w-auto shadow-sm"
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
              <Link href={`/driver/marketplace?page=${validPage - 1}&status=${status}`} className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white hover:bg-gray-50 font-semibold text-sm transition-colors text-slate-700">Anterior</Link>
            ) : (
              <span className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white opacity-50 cursor-not-allowed font-semibold text-sm text-slate-400">Anterior</span>
            )}
            <span className="text-slate-700 text-sm font-semibold">Página {validPage} de {totalPages}</span>
            {validPage < totalPages ? (
              <Link href={`/driver/marketplace?page=${validPage + 1}&status=${status}`} className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white hover:bg-gray-50 font-semibold text-sm transition-colors text-slate-700">Siguiente</Link>
            ) : (
              <span className="px-4 py-2 border border-[#D8DADC] rounded-lg bg-white opacity-50 cursor-not-allowed font-semibold text-sm text-slate-400">Siguiente</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}