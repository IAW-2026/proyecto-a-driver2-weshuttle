import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/api(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isDriverRoute = createRouteMatcher(["/driver(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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