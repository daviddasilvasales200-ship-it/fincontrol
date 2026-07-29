import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: erroUsuario,
    } =
      await supabase.auth.getUser();

    if (
      erroUsuario ||
      !user
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const segredo =
      process.env
        .CRON_SECRET
        ?.trim();

    if (!segredo) {
      console.error(
        "CRON_SECRET não foi configurado."
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A verificação de resultados não foi configurada no servidor.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Usa a própria origem da
     * requisição.
     *
     * Funciona em localhost e
     * também depois da publicação
     * na Vercel.
     */
    const urlCron =
      new URL(
        "/api/cron/verificar-resultados",
        request.url
      );

    const respostaCron =
      await fetch(
        urlCron,
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${segredo}`,

            "Content-Type":
              "application/json",
          },

          cache: "no-store",
        }
      );

    const tipoConteudo =
      respostaCron.headers.get(
        "content-type"
      );

    const textoResposta =
      await respostaCron.text();

    if (
      !tipoConteudo?.includes(
        "application/json"
      )
    ) {
      console.error(
        "Resposta inválida da rota cron:",
        {
          status:
            respostaCron.status,
          resposta:
            textoResposta,
        }
      );

      return NextResponse.json(
        {
          sucesso: false,

          erro:
            `A rota interna de verificação não retornou JSON. Status ${respostaCron.status}.`,
        },
        {
          status: 502,
        }
      );
    }

    let resultado:
      Record<
        string,
        unknown
      >;

    try {
      resultado =
        JSON.parse(
          textoResposta
        ) as Record<
          string,
          unknown
        >;
    } catch {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A rota interna retornou um JSON inválido.",
        },
        {
          status: 502,
        }
      );
    }

    if (!respostaCron.ok) {
      const mensagemErro =
        typeof resultado.erro ===
        "string"
          ? resultado.erro
          : "Não foi possível verificar os resultados.";

      return NextResponse.json(
        {
          ...resultado,

          sucesso: false,
          erro:
            mensagemErro,
        },
        {
          status:
            respostaCron.status,
        }
      );
    }

    return NextResponse.json(
      resultado,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Erro inesperado na rota segura de verificação:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível verificar os resultados.",
      },
      {
        status: 500,
      }
    );
  }
}