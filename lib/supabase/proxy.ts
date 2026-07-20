import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const rotaProtegida =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/receitas") ||
    pathname.startsWith("/despesas") ||
    pathname.startsWith("/assinaturas") ||
    pathname.startsWith("/investimentos") ||
    pathname.startsWith("/apostas") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/configuracoes");

  if (!user && rotaProtegida) {
    const url = request.nextUrl.clone();

    url.pathname = "/login";
    url.searchParams.set("erro", "login-necessario");

    return NextResponse.redirect(url);
  }

  const rotaAutenticacao =
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro");

  if (user && rotaAutenticacao) {
    const url = request.nextUrl.clone();

    url.pathname = "/dashboard";
    url.search = "";

    return NextResponse.redirect(url);
  }

  return response;
}