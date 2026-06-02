import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import PoolManager from "./PoolManager";
import Link from "next/link";

export default async function ActivePoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pool = await prisma.pool.findUnique({
    where: { id },
  });

  if (!pool) {
    notFound();
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl font-[family-name:var(--font-geist-sans)]">
      <Link href="/driver/marketplace" className="text-[#0A192F] hover:underline text-sm mb-4 inline-block">
        &larr; Volver al Marketplace
      </Link>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#0A192F]">Viaje Activo</h1>
          <p className="text-gray-500 mt-1">ID: <span className="font-mono">{pool.id}</span></p>
        </div>
        <span className={`px-4 py-1 rounded-full text-sm font-bold border ${
            pool.status === "COMPLETED" ? "bg-green-100 text-green-800 border-green-200" :
            pool.status === "CANCELED" ? "bg-red-100 text-red-800 border-red-200" :
            pool.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 border-blue-200" :
            "bg-yellow-100 text-yellow-800 border-yellow-200"
        }`}>
          {pool.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 font-medium">Destino</h3>
          <p className="text-lg font-semibold text-gray-900">{pool.destinationId}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 font-medium">Horario de Salida</h3>
          <p className="text-lg font-semibold text-gray-900">{pool.departureTime.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 font-medium">Ocupación</h3>
          <p className="text-lg font-semibold text-gray-900">{pool.currentPassengers} / {pool.maxCapacity} pasajeros</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm text-gray-500 font-medium">Hito Operativo</h3>
          <p className="text-lg font-semibold text-gray-900">{pool.hito || "Sin hitos registrados"}</p>
        </div>
      </div>

      <PoolManager pool={pool} />
    </div>
  );
}
