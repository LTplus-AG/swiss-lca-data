import { clerkMiddleware } from "@clerk/nextjs/server";
import { currentUser } from "@clerk/nextjs/server";

type Roles = "admin" | "moderator";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", // Don't run middleware on static files
    "/", // Run middleware on index page
    "/(api|trpc)(.*)",
  ], // Run middleware on API routes
};

export const checkRole = async (role: Roles) => {
  const user = await currentUser();
  return user?.publicMetadata?.role === role;
};
