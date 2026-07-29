import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type ResultadoDica =
  | "pendente"
  | "ganha"
  | "perdida"
  | "anulada";

type ErrosApi =
  Record<string, unknown>;

type EstatisticaApi = {
  type: string;

  value:
    | number
    | string
    | null;
};

type EstatisticasTimeApi = {
  team: {
    id: number;
    name: string;
  };

  statistics:
    EstatisticaApi[];
};

type PartidaResultadoApi = {
  fixture: {
    id: number;
    date: string;

    status: {
      long: string;
      short: string;

      elapsed:
        | number
        | null;
    };
  };

  league: {
    id: number;
    name: string;
    country: string;
  };

  teams: {
    home: {
      id: number;
      name: string;

      winner:
        | boolean
        | null;
    };

    away: {
      id: number;
      name: string;

      winner:
        | boolean
        | null;
    };
  };

  goals: {
    home:
      | number
      | null;

    away:
      | number
      | null;
  };

  score?: {
    halftime?: {
      home:
        | number
        | null;

      away:
        | number
        | null;
    };

    fulltime?: {
      home:
        | number
        | null;

      away:
        | number
        | null;
    };

    extratime?: {
      home:
        | number
        | null;

      away:
        | number
        | null;
    };

    penalty?: {
      home:
        | number
        | null;

      away:
        | number
        | null;
    };
  };

  statistics?:
    EstatisticasTimeApi[];
};

type RespostaPartidas = {
  response?:
    PartidaResultadoApi[];

  errors?:
    ErrosApi;
};

type DicaPendenteBanco = {
  id: number;

  fixture_id:
    | number
    | null;

  competicao: string;

  time_casa: string;
  time_visitante: string;

  data_jogo: string;

  horario_jogo:
    | string
    | null;

  mercado: string;
  entrada_sugerida: string;

  odd: number;

  status:
    | "ativa"
    | "encerrada"
    | "cancelada";

  resultado:
    ResultadoDica;
};

type DadosResultadoPartida = {
  fixtureId: number;

  status: string;

  golsCasa: number;
  golsVisitante: number;

  totalGols: number;

  totalEscanteios:
    | number
    | null;

  totalCartoes:
    | number
    | null;

  placarFinal: string;
};

type AvaliacaoDica = {
  resultado:
    ResultadoDica;

  lucroPrejuizo: number;

  motivo: string;
};

type DetalheProcessamento = {
  dicaId: number;
  fixtureId: number;

  confronto: string;
  mercado: string;
  entrada: string;

  resultado:
    ResultadoDica;

  motivo: string;
};

const URL_API =
  "https://v3.football.api-sports.io";

const LIMITE_PARTIDAS_POR_CONSULTA =
  20;

const STATUS_FINALIZADOS =
  new Set([
    "FT",
    "AET",
    "PEN",
  ]);

const STATUS_ANULADOS =
  new Set([
    "CANC",
    "ABD",
    "PST",
    "SUSP",
    "INT",
  ]);

function requisicaoAutorizada(
  request: NextRequest
) {
  const segredo =
    process.env
      .CRON_SECRET
      ?.trim();

  if (!segredo) {
    console.error(
      "CRON_SECRET não foi configurado."
    );

    return false;
  }

  const autorizacao =
    request.headers
      .get("authorization")
      ?.trim();

  return (
    autorizacao ===
    `Bearer ${segredo}`
  );
}

function possuiErrosApi(
  erros:
    | ErrosApi
    | undefined
) {
  return Boolean(
    erros &&
      Object.keys(erros).length >
        0
  );
}

function normalizarTexto(
  valor:
    | string
    | number
    | null
    | undefined
) {
  return String(
    valor ?? ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase(
      "pt-BR"
    )
    .replace(
      /\s+/g,
      " "
    );
}

function extrairNumero(
  valor:
    | string
    | number
    | null
    | undefined
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  const correspondencia =
    String(valor)
      .replace(
        ",",
        "."
      )
      .match(
        /\d+(?:\.\d+)?/
      );

  if (!correspondencia) {
    return null;
  }

  const numero =
    Number(
      correspondencia[0]
    );

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
}

function converterEstatistica(
  valor:
    | number
    | string
    | null
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return null;
  }

  if (
    typeof valor ===
    "number"
  ) {
    return Number.isFinite(
      valor
    )
      ? valor
      : null;
  }

  const numero =
    Number(
      valor
        .replace(
          "%",
          ""
        )
        .replace(
          ",",
          "."
        )
        .trim()
    );

  return Number.isFinite(
    numero
  )
    ? numero
    : null;
}

function dividirEmGrupos<T>(
  itens: T[],
  tamanho: number
) {
  const grupos: T[][] = [];

  for (
    let indice = 0;
    indice < itens.length;
    indice += tamanho
  ) {
    grupos.push(
      itens.slice(
        indice,
        indice + tamanho
      )
    );
  }

  return grupos;
}

async function consultarApi<T>(
  caminho: string,
  chaveApi: string
): Promise<T> {
  const resposta =
    await fetch(
      `${URL_API}${caminho}`,
      {
        method: "GET",

        headers: {
          "x-apisports-key":
            chaveApi,
        },

        cache: "no-store",
      }
    );

  const texto =
    await resposta.text();

  if (!resposta.ok) {
    console.error(
      "Erro HTTP da API-Football:",
      {
        caminho,

        status:
          resposta.status,

        resposta:
          texto,
      }
    );

    throw new Error(
      `API-Football retornou HTTP ${resposta.status}: ${texto}`
    );
  }

  try {
    return JSON.parse(
      texto
    ) as T;
  } catch {
    console.error(
      "Resposta inválida da API-Football:",
      {
        caminho,

        resposta:
          texto,
      }
    );

    throw new Error(
      "A API-Football retornou uma resposta inválida."
    );
  }
}

function obterValorEstatistica(
  partida:
    PartidaResultadoApi,

  nomesPossiveis:
    string[]
) {
  const nomesNormalizados =
    nomesPossiveis.map(
      (nome) =>
        normalizarTexto(
          nome
        )
    );

  let total = 0;
  let encontrou = false;

  for (
    const estatisticasTime of
    partida.statistics ?? []
  ) {
    const estatistica =
      estatisticasTime
        .statistics
        ?.find((item) => {
          const tipo =
            normalizarTexto(
              item.type
            );

          return nomesNormalizados.includes(
            tipo
          );
        });

    if (!estatistica) {
      continue;
    }

    const valor =
      converterEstatistica(
        estatistica.value
      );

    if (valor === null) {
      continue;
    }

    encontrou = true;
    total += valor;
  }

  return encontrou
    ? total
    : null;
}

function obterTotalCartoes(
  partida:
    PartidaResultadoApi
) {
  const amarelos =
    obterValorEstatistica(
      partida,
      [
        "Yellow Cards",
        "Cartões Amarelos",
      ]
    );

  const vermelhos =
    obterValorEstatistica(
      partida,
      [
        "Red Cards",
        "Cartões Vermelhos",
      ]
    );

  if (
    amarelos === null &&
    vermelhos === null
  ) {
    return null;
  }

  /*
   * Regra utilizada:
   *
   * cartão amarelo = 1
   * cartão vermelho = 1
   *
   * Algumas casas podem possuir
   * regras diferentes.
   */
  return (
    (amarelos ?? 0) +
    (vermelhos ?? 0)
  );
}

function transformarPartida(
  partida:
    PartidaResultadoApi
): DadosResultadoPartida | null {
  const golsCasa =
    partida.goals.home ??
    partida.score
      ?.fulltime
      ?.home;

  const golsVisitante =
    partida.goals.away ??
    partida.score
      ?.fulltime
      ?.away;

  if (
    golsCasa === null ||
    golsCasa === undefined ||
    golsVisitante === null ||
    golsVisitante === undefined
  ) {
    return null;
  }

  const totalEscanteios =
    obterValorEstatistica(
      partida,
      [
        "Corner Kicks",
        "Corners",
        "Escanteios",
      ]
    );

  const totalCartoes =
    obterTotalCartoes(
      partida
    );

  return {
    fixtureId:
      partida.fixture.id,

    status:
      partida.fixture.status
        .short,

    golsCasa,

    golsVisitante,

    totalGols:
      golsCasa +
      golsVisitante,

    totalEscanteios,

    totalCartoes,

    placarFinal:
      `${golsCasa} x ${golsVisitante}`,
  };
}

function calcularLucro(
  resultado:
    ResultadoDica,

  odd: number
) {
  if (
    resultado === "ganha"
  ) {
    return Number(
      Math.max(
        odd - 1,
        0
      ).toFixed(2)
    );
  }

  if (
    resultado === "perdida"
  ) {
    return -1;
  }

  return 0;
}

function criarAvaliacao(
  resultado:
    ResultadoDica,

  odd: number,

  motivo: string
): AvaliacaoDica {
  return {
    resultado,

    lucroPrejuizo:
      calcularLucro(
        resultado,
        odd
      ),

    motivo,
  };
}

function compararLinha(
  valorReal: number,

  linha: number,

  tipo:
    | "mais"
    | "menos",

  odd: number,

  descricao: string
): AvaliacaoDica {
  if (
    valorReal === linha
  ) {
    return criarAvaliacao(
      "anulada",

      odd,

      `${descricao}: o valor final foi exatamente igual à linha ${linha}.`
    );
  }

  if (
    tipo === "mais"
  ) {
    const ganhou =
      valorReal > linha;

    return criarAvaliacao(
      ganhou
        ? "ganha"
        : "perdida",

      odd,

      `${descricao}: foram registrados ${valorReal}, com linha de mais de ${linha}.`
    );
  }

  const ganhou =
    valorReal < linha;

  return criarAvaliacao(
    ganhou
      ? "ganha"
      : "perdida",

    odd,

    `${descricao}: foram registrados ${valorReal}, com linha de menos de ${linha}.`
  );
}

function avaliarResultadoPartida(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  const timeCasa =
    normalizarTexto(
      dica.time_casa
    );

  const timeVisitante =
    normalizarTexto(
      dica.time_visitante
    );

  const casaVenceu =
    partida.golsCasa >
    partida.golsVisitante;

  const visitanteVenceu =
    partida.golsVisitante >
    partida.golsCasa;

  const empate =
    partida.golsCasa ===
    partida.golsVisitante;

  if (
    entrada === "empate" ||
    entrada.includes(
      "resultado empate"
    )
  ) {
    return criarAvaliacao(
      empate
        ? "ganha"
        : "perdida",

      dica.odd,

      empate
        ? "A partida terminou empatada."
        : "A partida não terminou empatada."
    );
  }

  if (
    entrada.startsWith(
      "vitoria de "
    )
  ) {
    const equipe =
      entrada.replace(
        "vitoria de ",
        ""
      );

    if (
      equipe ===
        timeCasa ||
      timeCasa.includes(
        equipe
      ) ||
      equipe.includes(
        timeCasa
      )
    ) {
      return criarAvaliacao(
        casaVenceu
          ? "ganha"
          : "perdida",

        dica.odd,

        casaVenceu
          ? `${dica.time_casa} venceu a partida.`
          : `${dica.time_casa} não venceu a partida.`
      );
    }

    if (
      equipe ===
        timeVisitante ||
      timeVisitante.includes(
        equipe
      ) ||
      equipe.includes(
        timeVisitante
      )
    ) {
      return criarAvaliacao(
        visitanteVenceu
          ? "ganha"
          : "perdida",

        dica.odd,

        visitanteVenceu
          ? `${dica.time_visitante} venceu a partida.`
          : `${dica.time_visitante} não venceu a partida.`
      );
    }
  }

  return null;
}

function avaliarDuplaPossibilidade(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  const timeCasa =
    normalizarTexto(
      dica.time_casa
    );

  const timeVisitante =
    normalizarTexto(
      dica.time_visitante
    );

  const casaVenceu =
    partida.golsCasa >
    partida.golsVisitante;

  const visitanteVenceu =
    partida.golsVisitante >
    partida.golsCasa;

  const empate =
    partida.golsCasa ===
    partida.golsVisitante;

  if (
    entrada.includes(
      "ou empate"
    )
  ) {
    const equipe =
      entrada
        .replace(
          "ou empate",
          ""
        )
        .trim();

    if (
      equipe ===
        timeCasa ||
      timeCasa.includes(
        equipe
      ) ||
      equipe.includes(
        timeCasa
      )
    ) {
      const ganhou =
        casaVenceu ||
        empate;

      return criarAvaliacao(
        ganhou
          ? "ganha"
          : "perdida",

        dica.odd,

        ganhou
          ? `${dica.time_casa} venceu ou a partida terminou empatada.`
          : `${dica.time_casa} perdeu a partida.`
      );
    }

    if (
      equipe ===
        timeVisitante ||
      timeVisitante.includes(
        equipe
      ) ||
      equipe.includes(
        timeVisitante
      )
    ) {
      const ganhou =
        visitanteVenceu ||
        empate;

      return criarAvaliacao(
        ganhou
          ? "ganha"
          : "perdida",

        dica.odd,

        ganhou
          ? `${dica.time_visitante} venceu ou a partida terminou empatada.`
          : `${dica.time_visitante} perdeu a partida.`
      );
    }
  }

  return null;
}

function avaliarTotalGols(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  const linha =
    extrairNumero(
      dica.entrada_sugerida
    );

  if (
    linha === null
  ) {
    return null;
  }

  if (
    entrada.includes(
      "mais de"
    ) ||
    entrada.includes(
      "over"
    )
  ) {
    return compararLinha(
      partida.totalGols,

      linha,

      "mais",

      dica.odd,

      "Total de gols"
    );
  }

  if (
    entrada.includes(
      "menos de"
    ) ||
    entrada.includes(
      "under"
    )
  ) {
    return compararLinha(
      partida.totalGols,

      linha,

      "menos",

      dica.odd,

      "Total de gols"
    );
  }

  return null;
}

function avaliarAmbasMarcam(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  const ambasMarcaram =
    partida.golsCasa >
      0 &&
    partida.golsVisitante >
      0;

  const entradaSim =
    entrada.includes(
      "marcam: sim"
    ) ||
    entrada.endsWith(
      " sim"
    ) ||
    entrada === "yes";

  const entradaNao =
    entrada.includes(
      "marcam: nao"
    ) ||
    entrada.endsWith(
      " nao"
    ) ||
    entrada === "no";

  if (entradaSim) {
    return criarAvaliacao(
      ambasMarcaram
        ? "ganha"
        : "perdida",

      dica.odd,

      ambasMarcaram
        ? "As duas equipes marcaram gols."
        : "Pelo menos uma das equipes não marcou."
    );
  }

  if (entradaNao) {
    return criarAvaliacao(
      !ambasMarcaram
        ? "ganha"
        : "perdida",

      dica.odd,

      !ambasMarcaram
        ? "Pelo menos uma das equipes não marcou."
        : "As duas equipes marcaram gols."
    );
  }

  return null;
}

function avaliarEscanteios(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  if (
    partida.totalEscanteios ===
    null
  ) {
    return null;
  }

  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  const linha =
    extrairNumero(
      dica.entrada_sugerida
    );

  if (
    linha === null
  ) {
    return null;
  }

  if (
    entrada.includes(
      "mais de"
    ) ||
    entrada.includes(
      "over"
    )
  ) {
    return compararLinha(
      partida.totalEscanteios,

      linha,

      "mais",

      dica.odd,

      "Total de escanteios"
    );
  }

  if (
    entrada.includes(
      "menos de"
    ) ||
    entrada.includes(
      "under"
    )
  ) {
    return compararLinha(
      partida.totalEscanteios,

      linha,

      "menos",

      dica.odd,

      "Total de escanteios"
    );
  }

  return null;
}

function avaliarCartoes(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  if (
    partida.totalCartoes ===
    null
  ) {
    return null;
  }

  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  const linha =
    extrairNumero(
      dica.entrada_sugerida
    );

  if (
    linha === null
  ) {
    return null;
  }

  if (
    entrada.includes(
      "mais de"
    ) ||
    entrada.includes(
      "over"
    )
  ) {
    return compararLinha(
      partida.totalCartoes,

      linha,

      "mais",

      dica.odd,

      "Total de cartões"
    );
  }

  if (
    entrada.includes(
      "menos de"
    ) ||
    entrada.includes(
      "under"
    )
  ) {
    return compararLinha(
      partida.totalCartoes,

      linha,

      "menos",

      dica.odd,

      "Total de cartões"
    );
  }

  return null;
}

function avaliarDica(
  dica:
    DicaPendenteBanco,

  partida:
    DadosResultadoPartida
): AvaliacaoDica | null {
  const mercado =
    normalizarTexto(
      dica.mercado
    );

  if (
    mercado.includes(
      "dupla possibilidade"
    )
  ) {
    return avaliarDuplaPossibilidade(
      dica,
      partida
    );
  }

  if (
    mercado.includes(
      "resultado"
    )
  ) {
    return avaliarResultadoPartida(
      dica,
      partida
    );
  }

  if (
    mercado.includes(
      "ambas"
    )
  ) {
    return avaliarAmbasMarcam(
      dica,
      partida
    );
  }

  if (
    mercado.includes(
      "escanteio"
    )
  ) {
    return avaliarEscanteios(
      dica,
      partida
    );
  }

  if (
    mercado.includes(
      "cartao"
    )
  ) {
    return avaliarCartoes(
      dica,
      partida
    );
  }

  if (
    mercado.includes(
      "gol"
    )
  ) {
    return avaliarTotalGols(
      dica,
      partida
    );
  }

  /*
   * Compatibilidade para dicas
   * antigas ou com o nome de mercado
   * em formato diferente.
   */
  const entrada =
    normalizarTexto(
      dica.entrada_sugerida
    );

  if (
    entrada.includes(
      "escanteio"
    )
  ) {
    return avaliarEscanteios(
      dica,
      partida
    );
  }

  if (
    entrada.includes(
      "cartao"
    )
  ) {
    return avaliarCartoes(
      dica,
      partida
    );
  }

  if (
    entrada.includes(
      "gols"
    )
  ) {
    return avaliarTotalGols(
      dica,
      partida
    );
  }

  if (
    entrada.includes(
      "ambas"
    )
  ) {
    return avaliarAmbasMarcam(
      dica,
      partida
    );
  }

  if (
    entrada.includes(
      "ou empate"
    )
  ) {
    return avaliarDuplaPossibilidade(
      dica,
      partida
    );
  }

  if (
    entrada.startsWith(
      "vitoria de"
    ) ||
    entrada === "empate"
  ) {
    return avaliarResultadoPartida(
      dica,
      partida
    );
  }

  return null;
}

export async function GET(
  request: NextRequest
) {
  if (
    !requisicaoAutorizada(
      request
    )
  ) {
    return NextResponse.json(
      {
        sucesso: false,

        erro:
          "Não autorizado.",
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
          "API_FOOTBALL_KEY não foi configurada.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const supabase =
      createAdminClient();

    const {
      data:
        registros,

      error:
        erroConsulta,
    } = await supabase
      .from(
        "dicas_apostas"
      )
      .select(
        `
          id,
          fixture_id,
          competicao,
          time_casa,
          time_visitante,
          data_jogo,
          horario_jogo,
          mercado,
          entrada_sugerida,
          odd,
          status,
          resultado
        `
      )
      .eq(
        "resultado",
        "pendente"
      )
      .not(
        "fixture_id",
        "is",
        null
      )
      .order(
        "data_jogo",
        {
          ascending: true,
        }
      )
      .limit(100);

    if (
      erroConsulta
    ) {
      console.error(
        "Erro ao consultar dicas pendentes:",
        erroConsulta
      );

      return NextResponse.json(
        {
          sucesso: false,

          erro:
            "Não foi possível consultar as dicas pendentes.",
        },
        {
          status: 500,
        }
      );
    }

    const dicasPendentes =
      (
        registros ??
        []
      ).map(
        (registro) =>
          ({
            id:
              Number(
                registro.id
              ),

            fixture_id:
              registro.fixture_id ===
                null
                ? null
                : Number(
                    registro.fixture_id
                  ),

            competicao:
              String(
                registro.competicao
              ),

            time_casa:
              String(
                registro.time_casa
              ),

            time_visitante:
              String(
                registro.time_visitante
              ),

            data_jogo:
              String(
                registro.data_jogo
              ),

            horario_jogo:
              registro.horario_jogo
                ? String(
                    registro.horario_jogo
                  )
                : null,

            mercado:
              String(
                registro.mercado
              ),

            entrada_sugerida:
              String(
                registro.entrada_sugerida
              ),

            odd:
              Number(
                registro.odd
              ),

            status:
              registro.status as DicaPendenteBanco["status"],

            resultado:
              registro.resultado as ResultadoDica,
          })
      ) satisfies
        DicaPendenteBanco[];

    if (
      dicasPendentes.length ===
      0
    ) {
      return NextResponse.json({
        sucesso: true,

        mensagem:
          "Não existem dicas pendentes com fixture_id.",

        dicasPendentes:
          0,

        partidasConsultadas:
          0,

        consultasApi:
          0,

        dicasVerificadas:
          0,

        dicasGanhas:
          0,

        dicasPerdidas:
          0,

        dicasAnuladas:
          0,

        dicasAindaPendentes:
          0,

        dicasSemPartida:
          0,

        dicasSemEstatistica:
          0,

        errosAtualizacao:
          0,

        detalhes:
          [],
      });
    }

    const fixtureIds =
      Array.from(
        new Set(
          dicasPendentes
            .map(
              (dica) =>
                dica.fixture_id
            )
            .filter(
              (
                fixtureId
              ): fixtureId is number =>
                fixtureId !==
                  null &&
                Number.isInteger(
                  fixtureId
                )
            )
        )
      );

    const gruposFixtureIds =
      dividirEmGrupos(
        fixtureIds,

        LIMITE_PARTIDAS_POR_CONSULTA
      );

    const partidasApi:
      PartidaResultadoApi[] =
      [];

    let consultasApi =
      0;

    for (
      const grupo of
      gruposFixtureIds
    ) {
      if (
        grupo.length ===
        0
      ) {
        continue;
      }

      const ids =
        grupo.join("-");

      const dadosApi =
        await consultarApi<RespostaPartidas>(
          `/fixtures?ids=${ids}`,
          chaveApi
        );

      consultasApi +=
        1;

      if (
        possuiErrosApi(
          dadosApi.errors
        )
      ) {
        throw new Error(
          `Erro retornado pela API-Football: ${JSON.stringify(
            dadosApi.errors
          )}`
        );
      }

      partidasApi.push(
        ...(
          dadosApi.response ??
          []
        )
      );
    }

    const mapaPartidas =
      new Map<
        number,
        PartidaResultadoApi
      >(
        partidasApi.map(
          (partida) => [
            partida.fixture.id,
            partida,
          ]
        )
      );

    const detalhes:
      DetalheProcessamento[] =
      [];

    let dicasVerificadas =
      0;

    let dicasGanhas =
      0;

    let dicasPerdidas =
      0;

    let dicasAnuladas =
      0;

    let dicasAindaPendentes =
      0;

    let dicasSemPartida =
      0;

    let dicasSemEstatistica =
      0;

    let errosAtualizacao =
      0;

    for (
      const dica of
      dicasPendentes
    ) {
      if (
        dica.fixture_id ===
        null
      ) {
        continue;
      }

      const partidaApi =
        mapaPartidas.get(
          dica.fixture_id
        );

      if (!partidaApi) {
        dicasSemPartida +=
          1;

        continue;
      }

      const statusPartida =
        partidaApi.fixture
          .status
          .short;

      /*
       * Partidas canceladas,
       * adiadas, abandonadas,
       * suspensas ou interrompidas.
       */
      if (
        STATUS_ANULADOS.has(
          statusPartida
        )
      ) {
        const agora =
          new Date()
            .toISOString();

        const {
          error:
            erroAtualizar,
        } = await supabase
          .from(
            "dicas_apostas"
          )
          .update({
            resultado:
              "anulada",

            status:
              "cancelada",

            lucro_prejuizo:
              0,

            resultado_verificado_em:
              agora,

            atualizada_em:
              agora,
          })
          .eq(
            "id",
            dica.id
          );

        if (
          erroAtualizar
        ) {
          errosAtualizacao +=
            1;

          console.error(
            `Erro ao anular dica ${dica.id}:`,
            erroAtualizar
          );

          continue;
        }

        dicasVerificadas +=
          1;

        dicasAnuladas +=
          1;

        detalhes.push({
          dicaId:
            dica.id,

          fixtureId:
            dica.fixture_id,

          confronto:
            `${dica.time_casa} x ${dica.time_visitante}`,

          mercado:
            dica.mercado,

          entrada:
            dica.entrada_sugerida,

          resultado:
            "anulada",

          motivo:
            `A partida possui o status ${statusPartida}.`,
        });

        continue;
      }

      /*
       * Caso o jogo ainda não tenha
       * terminado, a dica continua
       * pendente.
       */
      if (
        !STATUS_FINALIZADOS.has(
          statusPartida
        )
      ) {
        dicasAindaPendentes +=
          1;

        continue;
      }

      const dadosPartida =
        transformarPartida(
          partidaApi
        );

      if (
        !dadosPartida
      ) {
        dicasSemEstatistica +=
          1;

        continue;
      }

      const avaliacao =
        avaliarDica(
          dica,
          dadosPartida
        );

      /*
       * Se não houver estatística
       * suficiente para avaliar,
       * mantém a dica pendente.
       */
      if (
        !avaliacao
      ) {
        dicasSemEstatistica +=
          1;

        continue;
      }

      const agora =
        new Date()
          .toISOString();

      const {
        error:
          erroAtualizar,
      } = await supabase
        .from(
          "dicas_apostas"
        )
        .update({
          resultado:
            avaliacao.resultado,

          status:
            avaliacao.resultado ===
              "anulada"
              ? "cancelada"
              : "encerrada",

          lucro_prejuizo:
            avaliacao.lucroPrejuizo,

          placar_final:
            dadosPartida
              .placarFinal,

          total_gols:
            dadosPartida
              .totalGols,

          total_escanteios:
            dadosPartida
              .totalEscanteios,

          total_cartoes:
            dadosPartida
              .totalCartoes,

          resultado_verificado_em:
            agora,

          atualizada_em:
            agora,
        })
        .eq(
          "id",
          dica.id
        );

      if (
        erroAtualizar
      ) {
        errosAtualizacao +=
          1;

        console.error(
          `Erro ao atualizar resultado da dica ${dica.id}:`,
          erroAtualizar
        );

        continue;
      }

      dicasVerificadas +=
        1;

      if (
        avaliacao.resultado ===
        "ganha"
      ) {
        dicasGanhas +=
          1;
      }

      if (
        avaliacao.resultado ===
        "perdida"
      ) {
        dicasPerdidas +=
          1;
      }

      if (
        avaliacao.resultado ===
        "anulada"
      ) {
        dicasAnuladas +=
          1;
      }

      detalhes.push({
        dicaId:
          dica.id,

        fixtureId:
          dica.fixture_id,

        confronto:
          `${dica.time_casa} x ${dica.time_visitante}`,

        mercado:
          dica.mercado,

        entrada:
          dica.entrada_sugerida,

        resultado:
          avaliacao.resultado,

        motivo:
          avaliacao.motivo,
      });
    }

    return NextResponse.json({
      sucesso: true,

      dicasPendentes:
        dicasPendentes.length,

      fixtureIdsUnicos:
        fixtureIds.length,

      consultasApi,

      partidasConsultadas:
        fixtureIds.length,

      partidasRetornadas:
        partidasApi.length,

      dicasVerificadas,

      dicasGanhas,

      dicasPerdidas,

      dicasAnuladas,

      dicasAindaPendentes,

      dicasSemPartida,

      dicasSemEstatistica,

      errosAtualizacao,

      detalhes,
    });
  } catch (error) {
    console.error(
      "Erro ao verificar resultados:",
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