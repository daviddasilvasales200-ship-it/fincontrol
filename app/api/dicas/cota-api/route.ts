import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

type RespostaStatusApi = {
  response?: {
    subscription?: {
      plan?: string;
      end?: string;
      active?: boolean;
    };

    requests?: {
      current?: number;
      limit_day?: number;
    };
  };

  errors?:
    | Record<string, unknown>
    | unknown[];
};

type StatusCota =
  | "disponivel"
  | "atencao"
  | "critica"
  | "esgotada"
  | "desconhecida";

function possuiErros(
  erros:
    | Record<string, unknown>
    | unknown[]
    | undefined
) {
  if (!erros) {
    return false;
  }

  if (Array.isArray(erros)) {
    return erros.length > 0;
  }

  return Object.keys(erros).length > 0;
}

function calcularStatusCota(
  restantes: number,
  limite: number
): StatusCota {
  if (
    limite <= 0 ||
    restantes < 0
  ) {
    return "desconhecida";
  }

  if (restantes === 0) {
    return "esgotada";
  }

  const percentualRestante =
    (restantes / limite) * 100;

  if (percentualRestante <= 15) {
    return "critica";
  }

  if (percentualRestante <= 40) {
    return "atencao";
  }

  return "disponivel";
}

export async function GET(
  request: NextRequest
) {
  try {
    const urlSupabase =
      process.env
        .NEXT_PUBLIC_SUPABASE_URL
        ?.trim();

    const chaveAnonima =
      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY
        ?.trim();

    if (
      !urlSupabase ||
      !chaveAnonima
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "As variáveis públicas do Supabase não foram configuradas.",
        },
        {
          status: 500,
        }
      );
    }

    const respostaCookies =
      NextResponse.next();

    const supabase =
      createServerClient(
        urlSupabase,
        chaveAnonima,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },

            setAll(cookies) {
              for (
                const cookie of
                cookies
              ) {
                respostaCookies.cookies.set(
                  cookie.name,
                  cookie.value,
                  cookie.options
                );
              }
            },
          },
        }
      );

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

    const chaveApi =
      process.env
        .API_FOOTBALL_KEY
        ?.trim();

    if (!chaveApi) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A chave da API-Football não foi configurada no servidor.",
        },
        {
          status: 500,
        }
      );
    }

    const resposta =
      await fetch(
        "https://v3.football.api-sports.io/status",
        {
          method: "GET",

          headers: {
            "x-apisports-key":
              chaveApi,
          },

          cache: "no-store",
        }
      );

    const textoResposta =
      await resposta.text();

    let dados:
      RespostaStatusApi;

    try {
      dados =
        JSON.parse(
          textoResposta
        ) as RespostaStatusApi;
    } catch {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A API-Football retornou uma resposta inválida.",
        },
        {
          status: 502,
        }
      );
    }

    if (!resposta.ok) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            `A API-Football retornou HTTP ${resposta.status}.`,
        },
        {
          status:
            resposta.status,
        }
      );
    }

    if (
      possuiErros(
        dados.errors
      )
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "A API-Football retornou um erro ao consultar a cota.",
          detalhes:
            dados.errors,
        },
        {
          status: 502,
        }
      );
    }

    const plano =
      dados.response
        ?.subscription
        ?.plan ??
      "Não informado";

    const assinaturaAtiva =
      Boolean(
        dados.response
          ?.subscription
          ?.active
      );

    const fimAssinatura =
      dados.response
        ?.subscription
        ?.end ??
      null;

    const usadasHoje =
      Number(
        dados.response
          ?.requests
          ?.current ??
          0
      );

    const limiteDiario =
      Number(
        dados.response
          ?.requests
          ?.limit_day ??
          0
      );

    const restantesHoje =
      Math.max(
        limiteDiario -
          usadasHoje,
        0
      );

    const percentualUsado =
      limiteDiario > 0
        ? Number(
            Math.min(
              Math.max(
                (
                  usadasHoje /
                  limiteDiario
                ) * 100,
                0
              ),
              100
            ).toFixed(1)
          )
        : 0;

    const percentualRestante =
      limiteDiario > 0
        ? Number(
            Math.min(
              Math.max(
                (
                  restantesHoje /
                  limiteDiario
                ) * 100,
                0
              ),
              100
            ).toFixed(1)
          )
        : 0;

    const limiteMinutoHeader =
      resposta.headers.get(
        "x-ratelimit-limit"
      );

    const restanteMinutoHeader =
      resposta.headers.get(
        "x-ratelimit-remaining"
      );

    const limiteDiarioHeader =
      resposta.headers.get(
        "x-ratelimit-requests-limit"
      );

    const restanteDiarioHeader =
      resposta.headers.get(
        "x-ratelimit-requests-remaining"
      );

    const limiteMinuto =
      limiteMinutoHeader === null
        ? null
        : Number(
            limiteMinutoHeader
          );

    const restanteMinuto =
      restanteMinutoHeader === null
        ? null
        : Number(
            restanteMinutoHeader
          );

    const limiteDiarioCabecalho =
      limiteDiarioHeader === null
        ? null
        : Number(
            limiteDiarioHeader
          );

    const restanteDiarioCabecalho =
      restanteDiarioHeader === null
        ? null
        : Number(
            restanteDiarioHeader
          );

    const statusCota =
      calcularStatusCota(
        restantesHoje,
        limiteDiario
      );

    return NextResponse.json({
      sucesso: true,

      plano,
      assinaturaAtiva,
      fimAssinatura,

      usadasHoje,
      limiteDiario,
      restantesHoje,

      percentualUsado,
      percentualRestante,

      statusCota,

      limiteDiarioHeader:
        limiteDiarioCabecalho !==
          null &&
        Number.isFinite(
          limiteDiarioCabecalho
        )
          ? limiteDiarioCabecalho
          : null,

      restanteDiarioHeader:
        restanteDiarioCabecalho !==
          null &&
        Number.isFinite(
          restanteDiarioCabecalho
        )
          ? restanteDiarioCabecalho
          : null,

      limiteMinuto:
        limiteMinuto !== null &&
        Number.isFinite(
          limiteMinuto
        )
          ? limiteMinuto
          : null,

      restanteMinuto:
        restanteMinuto !== null &&
        Number.isFinite(
          restanteMinuto
        )
          ? restanteMinuto
          : null,

      consultadoEm:
        new Date()
          .toISOString(),
    });
  } catch (error) {
    console.error(
      "Erro inesperado ao consultar cota da API:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a cota da API.",
      },
      {
        status: 500,
      }
    );
  }
}