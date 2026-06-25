import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDriverRoute = createRouteMatcher(["/driver(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);

  // 1. Validar peticiones entrantes a las APIs del Core (excluyendo mocks para testing local)
  if (url.pathname.startsWith("/api") && !url.pathname.startsWith("/api/mocks")) {
    const authHeader = req.headers.get("authorization");
    const internalKey = process.env.WESHUTTLE_INTERNAL_KEY;
    const analyticsKey = process.env.ANALYTICS_API_KEY;

    // Solo validamos si las llaves están configuradas en el entorno
    const isSecurityConfigured = !!(internalKey || analyticsKey);

    if (isSecurityConfigured) {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
          { error: "Unauthorized: Missing or malformed Authorization header" },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);

      if (req.method === "GET") {
        // GET (Lectura) acepta tanto la llave interna como la de analíticas
        if (token !== internalKey && token !== analyticsKey) {
          return NextResponse.json(
            { error: "Forbidden: Invalid API Key" },
            { status: 403 }
          );
        }
      } else {
        // Operaciones de escritura (POST/PUT/DELETE/etc) SOLO aceptan la llave interna
        if (token !== internalKey) {
          return NextResponse.json(
            { error: "Forbidden: Write operations require internal API Key" },
            { status: 403 }
          );
        }
      }
    }

    // Si la API Key es válida (o la seguridad no está configurada), dejamos pasar sin Clerk auth
    return NextResponse.next();
  }

  // 2. Comportamiento normal de Clerk para páginas web
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  const { sessionClaims } = await auth();
  const role = (sessionClaims?.role as string | undefined) ?? undefined;
  const clerkUserId = (sessionClaims?.sub as string | undefined) ?? undefined;

  if (isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isDriverRoute(req) && role !== "driver" && role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const requestHeaders = new Headers(req.headers);
  if (clerkUserId) {
    requestHeaders.set("x-clerk-user-id", clerkUserId);
  }
  if (role) {
    requestHeaders.set("x-user-role", role);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};