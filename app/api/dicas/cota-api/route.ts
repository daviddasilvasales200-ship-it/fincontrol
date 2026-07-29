import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  createServerClient,
} from "@supabase/ssr";

type ErrosApi =
  | Record<string, unknown>
  | unknown[];

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

  errors?: ErrosApi;
};

type StatusCota =
  | "disponivel"
  | "atencao"
  | "critica"
  | "esgotada"
  | "desconhecida";

type DadosConhecidosCota = {
  plano: string;
  assinaturaAtiva: boolean;
  fimAssinatura: string | null;

  usadasHoje: number;
  limiteDiario: number;
  restantesHoje: number;

  percentualUsado: number;
  percentualRestante: number;

  statusCota: StatusCota;

  limiteDiarioHeader: number | null;
  restanteDiarioHeader: number | null;

  limiteMinuto: number | null;
  restanteMinuto: number | null;

  consultadoEm: string;
};

function possuiErros(
  erros: ErrosApi | undefined
) {
  if (!erros) {
    return false;
  }

  if (Array.isArray(erros)) {
    return erros.length > 0;
  }

  return (
    Object.keys(erros).length > 0
  );
}

function transformarEmTexto(
  valor: unknown
): string {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (
    typeof valor === "string"
  ) {
    return valor;
  }

  if (
    typeof valor === "number" ||
    typeof valor === "boolean"
  ) {
    return String(valor);
  }

  if (Array.isArray(valor)) {
    return valor
      .map(transformarEmTexto)
      .join(" ");
  }

  if (
    typeof valor === "object"
  ) {
    return Object.entries(
      valor as Record<
        string,
        unknown
      >
    )
      .map(
        ([chave, conteudo]) =>
          `${chave} ${transformarEmTexto(
            conteudo
          )}`
      )
      .join(" ");
  }

  return "";
}

function normalizarTexto(
  valor: unknown
) {
  return transformarEmTexto(valor)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ");
}

function erroIndicaCotaEsgotada(
  valor: unknown
) {
  const texto =
    normalizarTexto(valor);

  const mensagens = [
    "you have reached the request limit for the day",
    "request limit for the day",
    "daily request limit",
    "daily limit reached",
    "requests limit reached",
    "quota exceeded",
    "rate limit exceeded",
    "limite diario",
    "cota diaria esgotada",
    "limite de requisicoes",
  ];

  return mensagens.some(
    (mensagem) =>
      texto.includes(mensagem)
  );
}

function converterHeaderNumero(
  valor: string | null
) {
  if (valor === null) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
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

  if (
    percentualRestante <= 15
  ) {
    return "critica";
  }

  if (
    percentualRestante <= 40
  ) {
    return "atencao";
  }

  return "disponivel";
}

function criarRespostaCotaEsgotada(
  limiteDiarioHeader:
    | number
    | null,

  limiteMinuto:
    | number
    | null,

  restanteMinuto:
    | number
    | null,

  detalhes?: unknown
) {
  /*
   * Caso a API não informe o
   * limite no cabeçalho, usamos
   * zero em vez de inventar um
   * valor de plano.
   */
  const limiteDiario =
    limiteDiarioHeader &&
    limiteDiarioHeader > 0
      ? limiteDiarioHeader
      : 0;

  const usadasHoje =
    limiteDiario;

  const dados:
    DadosConhecidosCota = {
    plano:
      "Não informado",

    assinaturaAtiva:
      true,

    fimAssinatura:
      null,

    usadasHoje,

    limiteDiario,

    restantesHoje:
      0,

    percentualUsado:
      100,

    percentualRestante:
      0,

    statusCota:
      "esgotada",

    limiteDiarioHeader,

    restanteDiarioHeader:
      0,

    limiteMinuto,

    restanteMinuto,

    consultadoEm:
      new Date().toISOString(),
  };

  return NextResponse.json({
    sucesso: true,

    ...dados,

    mensagem:
      "A cota diária da API-Football está esgotada.",

    cotaDetectadaPorErro:
      true,

    detalhes:
      detalhes ?? null,
  });
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
                const cookie of cookies
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

    const limiteDiarioHeader =
      converterHeaderNumero(
        resposta.headers.get(
          "x-ratelimit-requests-limit"
        )
      );

    const restanteDiarioHeader =
      converterHeaderNumero(
        resposta.headers.get(
          "x-ratelimit-requests-remaining"
        )
      );

    const limiteMinuto =
      converterHeaderNumero(
        resposta.headers.get(
          "x-ratelimit-limit"
        )
      );

    const restanteMinuto =
      converterHeaderNumero(
        resposta.headers.get(
          "x-ratelimit-remaining"
        )
      );

    let dados:
      RespostaStatusApi;

    try {
      dados =
        JSON.parse(
          textoResposta
        ) as RespostaStatusApi;
    } catch {
      /*
       * Algumas respostas de limite
       * podem não vir no formato
       * esperado. Nesse caso também
       * analisamos o texto bruto.
       */
      if (
        erroIndicaCotaEsgotada(
          textoResposta
        ) ||
        restanteDiarioHeader === 0
      ) {
        return criarRespostaCotaEsgotada(
          limiteDiarioHeader,
          limiteMinuto,
          restanteMinuto,
          textoResposta
        );
      }

      console.error(
        "Resposta inválida da API-Football:",
        textoResposta
      );

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

    /*
     * Primeiro verifica se o corpo
     * ou os cabeçalhos indicam que
     * a cota acabou.
     */
    if (
      erroIndicaCotaEsgotada(
        dados
      ) ||
      erroIndicaCotaEsgotada(
        textoResposta
      ) ||
      restanteDiarioHeader === 0
    ) {
      return criarRespostaCotaEsgotada(
        limiteDiarioHeader,
        limiteMinuto,
        restanteMinuto,
        dados.errors ??
          textoResposta
      );
    }

    if (!resposta.ok) {
      console.error(
        "Erro HTTP ao consultar cota:",
        {
          status:
            resposta.status,

          resposta:
            dados,
        }
      );

      return NextResponse.json(
        {
          sucesso: false,

          erro:
            `A API-Football retornou HTTP ${resposta.status}.`,
        },
        {
          status:
            resposta.status
        }
      );
    }

    if (
      possuiErros(
        dados.errors
      )
    ) {
      console.error(
        "Erro retornado pelo endpoint de cota:",
        dados.errors
      );

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

    const usadasInformadas =
      Number(
        dados.response
          ?.requests
          ?.current ??
          0
      );

    const limiteInformado =
      Number(
        dados.response
          ?.requests
          ?.limit_day ??
          0
      );

    const limiteDiario =
      Number.isFinite(
        limiteInformado
      ) &&
      limiteInformado > 0
        ? limiteInformado
        : limiteDiarioHeader ??
          0;

    const usadasHoje =
      Number.isFinite(
        usadasInformadas
      ) &&
      usadasInformadas >= 0
        ? usadasInformadas
        : 0;

    const restantesCalculados =
      Math.max(
        limiteDiario -
          usadasHoje,
        0
      );

    /*
     * Quando o header estiver
     * disponível, ele tem prioridade
     * para indicar o saldo.
     */
    const restantesHoje =
      restanteDiarioHeader !==
        null &&
      restanteDiarioHeader >= 0
        ? restanteDiarioHeader
        : restantesCalculados;

    const percentualUsado =
      limiteDiario > 0
        ? Number(
            Math.min(
              Math.max(
                (
                  (
                    limiteDiario -
                    restantesHoje
                  ) /
                  limiteDiario
                ) *
                  100,
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
                ) *
                  100,
                0
              ),
              100
            ).toFixed(1)
          )
        : 0;

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

      limiteDiarioHeader,
      restanteDiarioHeader,

      limiteMinuto,
      restanteMinuto,

      cotaDetectadaPorErro:
        false,

      consultadoEm:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Erro inesperado ao consultar cota da API:",
      error
    );

    /*
     * Também detecta o limite caso
     * o erro tenha sido lançado por
     * alguma etapa da consulta.
     */
    if (
      erroIndicaCotaEsgotada(
        error
      )
    ) {
      return criarRespostaCotaEsgotada(
        null,
        null,
        null,
        error instanceof Error
          ? error.message
          : error
      );
    }

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