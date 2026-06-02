import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId, sessionClaims } = await auth();

  // Si el usuario está logueado, lo redirigimos a su dashboard correspondiente
  if (userId) {
    const role = sessionClaims?.role as string | undefined;
    
    if (role === "admin") {
      redirect("/admin/dashboard");
    } else if (role === "driver") {
      redirect("/driver/dashboard");
    } else {
      return (
        <div className="flex flex-col items-center justify-center min-h-[75vh] px-6 text-center">
          <div className="bg-red-50 text-red-600 p-8 rounded-lg shadow-sm max-w-md border border-red-100">
            <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
            <p>Esta aplicación es exclusiva para Conductores y Administradores de WeShuttle. Tu cuenta actual no tiene los permisos necesarios.</p>
          </div>
        </div>
      );
    }
  }

  // Landing page genérica si no está logueado
  return (
    <main className="flex flex-col flex-1 items-center justify-center min-h-[80vh] p-8 text-center bg-slate-50">
      <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
        WeShuttle <span className="text-blue-600">Driver</span>
      </h1>
      <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
        Portal operativo exclusivo para conductores de la plataforma. Gestiona tus vehículos y acepta nuevos viajes de pool.
      </p>
      <Link 
        href="/sign-in" 
        className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-200 shadow-sm"
      >
        Iniciar Sesión
      </Link>
    </main>
  );
}