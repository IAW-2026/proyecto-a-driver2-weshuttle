import { SignUp } from "@clerk/nextjs";
import Image from "next/image";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A192F] p-4 font-sans">
      
      {/* Logo and Header */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-white p-2.5 rounded-2xl shadow-lg mb-4 w-20 h-20 flex items-center justify-center overflow-hidden">
          <Image
            src="/logo-ws-recortado.jpeg"
            alt="WeShuttle Logo"
            width={72}
            height={72}
            className="object-contain"
            priority
          />
        </div>
        
        <h1 className="text-4xl font-extrabold italic text-white tracking-tight mb-3">
          WeShuttle
        </h1>
        
        <p className="text-[#94A3B8] text-sm max-w-xs font-medium leading-relaxed">
          Registrate para comenzar a coordinar traslados
        </p>
      </div>

      {/* Clerk SignUp component */}
      <div className="flex justify-center w-full animate-in fade-in zoom-in duration-300">
        <SignUp />
      </div>
    </div>
  );
}