'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // En un entorno de producción, aquí se podría enviar el error a un servicio como Sentry
    console.error('Error no controlado interceptado por error.tsx:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
      <div className="bg-red-50 text-red-500 rounded-full p-6 mb-6">
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-900 mb-4">¡Ups! Algo salió mal</h2>
      <p className="text-slate-600 mb-8 max-w-md">
        Ocurrió un error inesperado en la plataforma. Por favor, intenta de nuevo o regresa a la página principal.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200"
        >
          Intentar nuevamente
        </button>
        <Link
          href="/"
          className="px-6 py-3 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition duration-200"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}