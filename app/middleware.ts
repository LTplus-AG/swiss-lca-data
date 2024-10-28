import { clerkMiddleware, getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  // Await the auth function to get the resolved auth object
  const userAuth = await auth(); // Get the auth object without arguments

  // Check if trying to access admin routes
  if (req.nextUrl.pathname.startsWith("/admin-console")) {
    const isAdmin = userAuth?.sessionClaims?.metadata?.role === "admin"; // TypeScript should recognize 'role' now
    if (!isAdmin) {
      // Redirect non-admin users to home page
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
