import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Route ini wajib ada agar:
 * 1. Konfirmasi email setelah Register berhasil redirect ke dashboard
 * 2. Link reset password dari email dapat diproses
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");

  // Tampilkan error dari Supabase jika ada
  if (error) {
    const desc = searchParams.get("error_description") ?? "Unknown error";
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(desc)}`,
    );
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[],
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error: exchangeErr } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeErr) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
