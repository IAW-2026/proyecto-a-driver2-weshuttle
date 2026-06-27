import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Obtiene el email del usuario logueado desde Clerk, buscando
 * primero en los claims de sesión y cayendo en una consulta a la API de Clerk si no está presente.
 */
export async function getClerkUserEmail(): Promise<string | null> {
  try {
    const { sessionClaims } = await auth();
    
    // Buscar en claims habituales
    const claims = sessionClaims as {
      email?: string;
      primary_email?: string;
      email_address?: string;
    } | null;

    const emailFromClaim = 
      claims?.email || 
      claims?.primary_email || 
      claims?.email_address;
      
    if (emailFromClaim) {
      return emailFromClaim;
    }

    // Fallback: Consulta directa al usuario autenticado por API de Clerk
    const user = await currentUser();
    if (user && user.emailAddresses && user.emailAddresses.length > 0) {
      return user.emailAddresses[0].emailAddress;
    }

    return null;
  } catch (err) {
    console.error("Error al obtener email de Clerk:", err);
    return null;
  }
}
