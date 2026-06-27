'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.refresh();
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-100 flex items-center justify-center">
            <Image
              src="/logo-ws-recortado.jpeg"
              alt="WeShuttle Logo"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <span className="font-extrabold italic text-xl text-[#0A192F] tracking-tight">WeShuttle</span>
        </div>
        <Link 
          href="/sign-in"
          className="bg-[#0A192F] text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors uppercase tracking-wide shadow-sm"
        >
          Ingresar
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12 flex flex-col gap-10">
        
        {/* Hero Section */}
        <section className="space-y-4 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0A192F] tracking-tight">
            Bienvenido/a, Conductor
          </h1>
          <p className="text-slate-500 text-base sm:text-lg leading-relaxed max-w-2xl font-medium">
            Encontrá viajes corporativos y generá ingresos manejando tus propios horarios.
          </p>
        </section>

        {/* CTA Card */}
        <section className="bg-[#0A192F] rounded-2xl p-8 sm:p-12 shadow-xl animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
          <h2 className="text-3xl font-bold text-white mb-4">¿Querés empezar a manejar?</h2>
          <p className="text-slate-300 mb-8 max-w-xl text-sm sm:text-base leading-relaxed">
            Unite a nuestra plataforma exclusiva de traslados corporativos. Reservá tus horarios, elegí los viajes que más te convengan y generá ingresos de manera segura.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/sign-up"
              className="bg-white text-[#0A192F] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-slate-100 transition-colors text-center uppercase tracking-wide shadow-md"
            >
              Registrarme
            </Link>
            <Link 
              href="/sign-in"
              className="bg-transparent border-2 border-slate-600 text-white font-bold text-sm px-8 py-3.5 rounded-xl hover:border-slate-400 hover:bg-slate-800/50 transition-colors text-center uppercase tracking-wide"
            >
              Iniciar Sesión
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="pt-8 pb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
          <h3 className="text-2xl font-extrabold text-[#0A192F] mb-6">La Experiencia WeShuttle</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-5">
                <span className="material-symbols-outlined text-2xl">schedule</span>
              </div>
              <h4 className="font-bold text-[#0A192F] text-lg mb-2">Flexibilidad Total</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Elegí tus propios horarios y los viajes que mejor se adapten a tu rutina diaria. Vos tenés el control.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-emerald-50 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-5">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <h4 className="font-bold text-[#0A192F] text-lg mb-2">Ingresos Seguros</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Pagos rápidos, transparentes y garantizados por cada servicio corporativo completado.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-amber-50 w-12 h-12 rounded-xl flex items-center justify-center text-amber-600 mb-5">
                <span className="material-symbols-outlined text-2xl">support_agent</span>
              </div>
              <h4 className="font-bold text-[#0A192F] text-lg mb-2">Soporte 24/7</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Nuestro equipo de operaciones te acompaña en cada viaje para resolver cualquier eventualidad.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
