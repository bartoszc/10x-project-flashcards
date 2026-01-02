import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/login",
  "/register",
  "/auth/reset-password",
  "/auth/new-password",
  "/", // Landing page
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/auth/logout",
  "/api/auth/account",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, locals, request, cookies, redirect } = context;

  // Create Supabase server client
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Make supabase available in locals
  locals.supabase = supabase as any;

  // Check auth session
  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    locals.user = {
      email: user.email ?? "",
      id: user.id,
    };
  }

  // Route Protection Logic
  const isPublicPath = PUBLIC_PATHS.some((path) => {
    if (path === "/") return url.pathname === "/";
    return url.pathname.startsWith(path);
  });

  // Protected Routes: Redirect unauthenticated users to login
  if (!user && !isPublicPath) {
    return redirect("/login");
  }

  // Auth Routes: Redirect authenticated users to app
  const isAuthPage = ["/login", "/register"].some((path) => url.pathname === path);
  if (user && isAuthPage) {
    return redirect("/generate");
  }

  return next();
});
