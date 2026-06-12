import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: CookieOptions;
          }[],
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rute yang selalu boleh diakses tanpa cek login
  const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/forgot-password",
    "/auth/callback",
    "/reset-password",
  ];

  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Belum login, akses halaman terproteksi → redirect ke login
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sudah login, akses halaman auth biasa → redirect ke dashboard
  const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password"];
  const isAuthPath = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p));
  if (user && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|ico|webp|css|js)$).*)",
  ],
};
