import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "@/lib/supabase/server";

type RespostaAtualizacao = {
  sucesso?: boolean;
  erro?: string;
  partidasEncontradas?: number;
  partidasAnalisadas?: number;
  dicasSelecionadas?: number;
  dicasInseridas?: number;
};

export async function POST(
  request: NextRequest
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: usuarioError,
    } = await supabase.auth.getUser();

    if (usuarioError || !user) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const cronSecret =
      process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A variável CRON_SECRET não foi configurada no arquivo .env.local.",
        },
        {
          status: 500,
        }
      );
    }

    const urlCron = new URL(
      "/api/cron/atualizar-dicas",
      request.nextUrl.origin
    );

    const respostaCron = await fetch(
      urlCron,
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${cronSecret}`,
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
        "A rota cron retornou conteúdo inválido:",
        textoResposta
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A rota de atualização automática não retornou JSON.",
          statusCron:
            respostaCron.status,
          detalhes:
            textoResposta.slice(
              0,
              500
            ),
        },
        {
          status: 500,
        }
      );
    }

    let dados:
      | RespostaAtualizacao
      | null = null;

    try {
      dados = JSON.parse(
        textoResposta
      ) as RespostaAtualizacao;
    } catch (error) {
      console.error(
        "Erro ao interpretar resposta da rota cron:",
        error
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A resposta da rota cron não contém um JSON válido.",
          detalhes:
            textoResposta.slice(
              0,
              500
            ),
        },
        {
          status: 500,
        }
      );
    }

    if (!respostaCron.ok) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            dados?.erro ??
            "A atualização das dicas apresentou um erro.",
          partidasEncontradas:
            dados?.partidasEncontradas ??
            0,
          partidasAnalisadas:
            dados?.partidasAnalisadas ??
            0,
          dicasSelecionadas:
            dados?.dicasSelecionadas ??
            0,
          dicasInseridas:
            dados?.dicasInseridas ??
            0,
        },
        {
          status:
            respostaCron.status,
        }
      );
    }

    return NextResponse.json({
      sucesso:
        dados?.sucesso ?? true,

      partidasEncontradas:
        dados?.partidasEncontradas ??
        0,

      partidasAnalisadas:
        dados?.partidasAnalisadas ??
        0,

      dicasSelecionadas:
        dados?.dicasSelecionadas ??
        0,

      dicasInseridas:
        dados?.dicasInseridas ??
        0,
    });
  } catch (error) {
    console.error(
      "Erro na atualização manual das dicas:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar as dicas.",
      },
      {
        status: 500,
      }
    );
  }
}