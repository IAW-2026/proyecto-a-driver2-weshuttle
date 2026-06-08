import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const role = sessionClaims?.role as string | undefined;

  // Si el usuario tiene el rol de conductor, verificamos si su perfil está completo
  if (role === "driver") {
    const driver = await prisma.driver.findUnique({
      where: { clerk_user_id: userId },
    });

    const isProfileIncomplete =
      !driver ||
      !driver.full_name ||
      driver.full_name === "Conductor Nuevo" ||
      !driver.phone ||
      driver.phone.trim() === "";

    if (isProfileIncomplete) {
      redirect("/driver-complete-profile");
    }
  }

  return <>{children}</>;
}
