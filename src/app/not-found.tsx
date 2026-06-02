import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
      <h2 className="text-7xl font-extrabold text-blue-600 mb-4 tracking-tight">
        404
      </h2>
      <h3 className="text-3xl font-bold text-slate-900 mb-4">
        Página no encontrada
      </h3>
      <p className="text-slate-600 mb-8 max-w-md text-lg">
        Lo sentimos, la ruta a la que intentas acceder no existe, fue movida o no tienes permisos para verla.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
      >
        Volver al inicio
      </Link>
    </div>
  );
}