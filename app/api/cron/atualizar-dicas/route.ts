import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type ErrosApi =
  Record<string, unknown>;

type NivelConfianca =
  | "baixa"
  | "media"
  | "alta";

type CategoriaMercado =
  | "resultado"
  | "dupla"
  | "gols"
  | "ambas"
  | "escanteios"
  | "cartoes";

type PartidaApi = {
  fixture: {
    id: number;
    date: string;

    status: {
      short: string;
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
    };

    away: {
      id: number;
      name: string;
    };
  };
};

type PrevisaoApi = {
  predictions: {
    winner: {
      id: number | null;
      name: string | null;
      comment: string | null;
    };

    win_or_draw: boolean | null;
    under_over: string | null;

    goals: {
      home: string | null;
      away: string | null;
    };

    advice: string | null;

    percent: {
      home: string | null;
      draw: string | null;
      away: string | null;
    };
  };
};

type ValorOddApi = {
  value: string | number;
  odd: string;
};

type MercadoBookmakerApi = {
  id: number;
  name: string;
  values: ValorOddApi[];
};

type BookmakerApi = {
  id: number;
  name: string;
  bets: MercadoBookmakerApi[];
};

type OddsPartidaApi = {
  fixture: {
    id: number;
  };

  bookmakers: BookmakerApi[];
};

type RespostaPartidas = {
  response?: PartidaApi[];
  errors?: ErrosApi;
};

type RespostaPrevisao = {
  response?: PrevisaoApi[];
  errors?: ErrosApi;
};

type RespostaOdds = {
  response?: OddsPartidaApi[];
  errors?: ErrosApi;
};

type CompeticaoPrioritaria = {
  id: number;
  nomeExibicao: string;
  prioridade: number;
};

type CandidatoOdd = {
  categoria: CategoriaMercado;
  mercado: string;
  selecao: string;
  odd: number;
  bookmaker: string;
};

type DicaSelecionada = {
  fixtureId: number;
  categoria: CategoriaMercado;
  prioridadeCompeticao: number;

  esporte: string;
  competicao: string;

  time_casa: string;
  time_visitante: string;

  data_jogo: string;
  horario_jogo: string;

  mercado: string;
  entrada_sugerida: string;

  odd: number;
  probabilidade_estimada: number;

  nivel_confianca: NivelConfianca;

  justificativa: string;
  fonte_dados: string;

  status: "ativa";
  resultado: "pendente";

  lucro_prejuizo: number;
  destaque: boolean;

  publicada_em: string;
  atualizada_em: string;

  pontuacao: number;
};

type AnalisePartida = {
  partida: PartidaApi;
  previsao: PrevisaoApi;
  competicao: CompeticaoPrioritaria;
};

const URL_API =
  "https://v3.football.api-sports.io";

const COMPETICOES_PRIORITARIAS:
  CompeticaoPrioritaria[] = [
  {
    id: 71,
    nomeExibicao:
      "Brasileirão Série A",
    prioridade: 1,
  },
  {
    id: 72,
    nomeExibicao:
      "Brasileirão Série B",
    prioridade: 2,
  },
  {
    id: 73,
    nomeExibicao:
      "Copa do Brasil",
    prioridade: 3,
  },
  {
    id: 75,
    nomeExibicao:
      "Brasileirão Série C",
    prioridade: 4,
  },
  {
    id: 76,
    nomeExibicao:
      "Brasileirão Série D",
    prioridade: 5,
  },
  {
    id: 2,
    nomeExibicao:
      "Champions League",
    prioridade: 6,
  },
  {
    id: 3,
    nomeExibicao:
      "Europa League",
    prioridade: 7,
  },
  {
    id: 848,
    nomeExibicao:
      "Conference League",
    prioridade: 8,
  },
  {
    id: 39,
    nomeExibicao:
      "Premier League",
    prioridade: 9,
  },
  {
    id: 140,
    nomeExibicao:
      "La Liga",
    prioridade: 10,
  },
  {
    id: 135,
    nomeExibicao:
      "Serie A Italiana",
    prioridade: 11,
  },
  {
    id: 78,
    nomeExibicao:
      "Bundesliga",
    prioridade: 12,
  },
  {
    id: 61,
    nomeExibicao:
      "Ligue 1",
    prioridade: 13,
  },
  {
    id: 94,
    nomeExibicao:
      "Primeira Liga",
    prioridade: 14,
  },
  {
    id: 88,
    nomeExibicao:
      "Eredivisie",
    prioridade: 15,
  },
  {
    id: 307,
    nomeExibicao:
      "Saudi Pro League",
    prioridade: 16,
  },
];

const MAPA_COMPETICOES =
  new Map(
    COMPETICOES_PRIORITARIAS.map(
      (competicao) => [
        competicao.id,
        competicao,
      ]
    )
  );

const LIMITE_PARTIDAS_ANALISADAS =
  6;

const LIMITE_DICAS_PUBLICADAS =
  8;

const LIMITE_DICAS_POR_PARTIDA =
  2;

const LIMITE_DICAS_POR_CATEGORIA =
  3;

const ODD_MINIMA = 1.35;
const ODD_MAXIMA = 3.5;

const INTERVALO_REQUISICOES_MS =
  7000;

function aguardar(
  milissegundos: number
) {
  return new Promise<void>(
    (resolver) => {
      setTimeout(
        resolver,
        milissegundos
      );
    }
  );
}

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
      Object.keys(erros).length > 0
  );
}

function normalizarTexto(
  valor: string | number
) {
  return String(valor)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLocaleLowerCase(
      "pt-BR"
    )
    .replace(/\s+/g, " ");
}

function converterPercentual(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return 0;
  }

  const numero =
    Number(
      valor
        .replace("%", "")
        .replace(",", ".")
        .trim()
    );

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function converterOdd(
  valor: string
) {
  const numero =
    Number(
      valor
        .replace(",", ".")
        .trim()
    );

  if (
    !Number.isFinite(numero) ||
    numero < ODD_MINIMA ||
    numero > ODD_MAXIMA
  ) {
    return null;
  }

  return Number(
    numero.toFixed(2)
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
      .replace(",", ".")
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

  return Number.isFinite(numero)
    ? numero
    : null;
}

function obterDataBrasilia(
  adicionarDias = 0
) {
  const data =
    new Date();

  data.setDate(
    data.getDate() +
      adicionarDias
  );

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Sao_Paulo",

      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(data);
}

function formatarDataHora(
  dataIso: string
) {
  const data =
    new Date(dataIso);

  const dataJogo =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(data);

  const horarioJogo =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Sao_Paulo",

        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).format(data);

  return {
    dataJogo,
    horarioJogo,
  };
}

function classificarConfianca(
  probabilidade: number
): NivelConfianca {
  if (
    probabilidade >= 70
  ) {
    return "alta";
  }

  if (
    probabilidade >= 60
  ) {
    return "media";
  }

  return "baixa";
}

function calcularProbabilidadeImplicita(
  odd: number
) {
  const percentual =
    (1 / odd) *
    100 *
    0.94;

  return Number(
    Math.min(
      Math.max(
        percentual,
        40
      ),
      80
    ).toFixed(1)
  );
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

function identificarCategoriaMercado(
  nomeMercado: string
): CategoriaMercado | null {
  const nome =
    normalizarTexto(
      nomeMercado
    );

  if (
    nome.includes(
      "double chance"
    ) ||
    nome.includes(
      "dupla possibilidade"
    )
  ) {
    return "dupla";
  }

  if (
    nome ===
      "match winner" ||
    nome ===
      "match result" ||
    nome === "1x2" ||
    nome.includes(
      "resultado da partida"
    )
  ) {
    return "resultado";
  }

  if (
    nome.includes(
      "both teams score"
    ) ||
    nome.includes(
      "both teams to score"
    ) ||
    nome.includes(
      "ambas as equipes marcam"
    )
  ) {
    return "ambas";
  }

  if (
    nome.includes(
      "corner"
    ) &&
    (
      nome.includes(
        "over"
      ) ||
      nome.includes(
        "under"
      ) ||
      nome.includes(
        "total"
      )
    )
  ) {
    return "escanteios";
  }

  if (
    (
      nome.includes(
        "card"
      ) ||
      nome.includes(
        "booking"
      )
    ) &&
    (
      nome.includes(
        "over"
      ) ||
      nome.includes(
        "under"
      ) ||
      nome.includes(
        "total"
      )
    )
  ) {
    return "cartoes";
  }

  if (
    !nome.includes(
      "corner"
    ) &&
    !nome.includes(
      "card"
    ) &&
    !nome.includes(
      "booking"
    ) &&
    (
      nome.includes(
        "goals over/under"
      ) ||
      nome.includes(
        "goals over under"
      ) ||
      nome.includes(
        "total goals"
      ) ||
      nome === "goals"
    )
  ) {
    return "gols";
  }

  return null;
}

function linhaMercadoPermitida(
  categoria:
    CategoriaMercado,
  selecao: string
) {
  const numero =
    extrairNumero(
      selecao
    );

  if (
    categoria ===
      "escanteios"
  ) {
    return (
      numero !== null &&
      numero >= 6.5 &&
      numero <= 13.5
    );
  }

  if (
    categoria ===
      "cartoes"
  ) {
    return (
      numero !== null &&
      numero >= 1.5 &&
      numero <= 7.5
    );
  }

  if (
    categoria ===
      "gols"
  ) {
    return (
      numero !== null &&
      numero >= 1.5 &&
      numero <= 4.5
    );
  }

  return true;
}

function formatarSelecaoMercado(
  categoria:
    CategoriaMercado,
  selecaoOriginal: string
) {
  const normalizado =
    normalizarTexto(
      selecaoOriginal
    );

  const numero =
    extrairNumero(
      selecaoOriginal
    );

  const acima =
    normalizado.includes(
      "over"
    ) ||
    normalizado.includes(
      "mais"
    );

  const abaixo =
    normalizado.includes(
      "under"
    ) ||
    normalizado.includes(
      "menos"
    );

  if (
    categoria === "gols"
  ) {
    if (
      acima &&
      numero !== null
    ) {
      return `Mais de ${numero
        .toFixed(1)
        .replace(
          ".",
          ","
        )} gols`;
    }

    if (
      abaixo &&
      numero !== null
    ) {
      return `Menos de ${numero
        .toFixed(1)
        .replace(
          ".",
          ","
        )} gols`;
    }
  }

  if (
    categoria ===
      "escanteios"
  ) {
    if (
      acima &&
      numero !== null
    ) {
      return `Mais de ${numero
        .toFixed(1)
        .replace(
          ".",
          ","
        )} escanteios`;
    }

    if (
      abaixo &&
      numero !== null
    ) {
      return `Menos de ${numero
        .toFixed(1)
        .replace(
          ".",
          ","
        )} escanteios`;
    }
  }

  if (
    categoria ===
      "cartoes"
  ) {
    if (
      acima &&
      numero !== null
    ) {
      return `Mais de ${numero
        .toFixed(1)
        .replace(
          ".",
          ","
        )} cartões`;
    }

    if (
      abaixo &&
      numero !== null
    ) {
      return `Menos de ${numero
        .toFixed(1)
        .replace(
          ".",
          ","
        )} cartões`;
    }
  }

  if (
    categoria ===
      "ambas"
  ) {
    if (
      normalizado ===
        "yes" ||
      normalizado ===
        "sim"
    ) {
      return "Ambas as equipes marcam: Sim";
    }

    if (
      normalizado ===
        "no" ||
      normalizado ===
        "nao"
    ) {
      return "Ambas as equipes marcam: Não";
    }
  }

  return selecaoOriginal;
}

function coletarCandidatosOdds(
  dadosOdds:
    RespostaOdds
) {
  const candidatos =
    new Map<
      string,
      CandidatoOdd
    >();

  for (
    const registro of
    dadosOdds.response ??
    []
  ) {
    for (
      const bookmaker of
      registro.bookmakers ??
      []
    ) {
      for (
        const aposta of
        bookmaker.bets ??
        []
      ) {
        const categoria =
          identificarCategoriaMercado(
            aposta.name
          );

        if (!categoria) {
          continue;
        }

        for (
          const valor of
          aposta.values ??
          []
        ) {
          const odd =
            converterOdd(
              valor.odd
            );

          if (
            odd === null
          ) {
            continue;
          }

          const selecao =
            String(
              valor.value
            );

          if (
            !linhaMercadoPermitida(
              categoria,
              selecao
            )
          ) {
            continue;
          }

          const chave =
            `${categoria}|${normalizarTexto(
              selecao
            )}`;

          const candidato:
            CandidatoOdd = {
            categoria,

            mercado:
              aposta.name,

            selecao,

            odd,

            bookmaker:
              bookmaker.name,
          };

          const existente =
            candidatos.get(
              chave
            );

          if (
            !existente ||
            candidato.odd >
              existente.odd
          ) {
            candidatos.set(
              chave,
              candidato
            );
          }
        }
      }
    }
  }

  return Array.from(
    candidatos.values()
  );
}

function identificarLadoResultado(
  selecao: string
) {
  const texto =
    normalizarTexto(
      selecao
    ).replace(
      /\s/g,
      ""
    );

  if (
    [
      "home",
      "1",
      "homewin",
    ].includes(texto)
  ) {
    return "casa";
  }

  if (
    [
      "away",
      "2",
      "awaywin",
    ].includes(texto)
  ) {
    return "visitante";
  }

  if (
    [
      "draw",
      "x",
      "empate",
    ].includes(texto)
  ) {
    return "empate";
  }

  return null;
}

function identificarLadoDupla(
  selecao: string
) {
  const texto =
    normalizarTexto(
      selecao
    )
      .replace(
        /\s/g,
        ""
      )
      .replace(
        /\//g,
        ""
      )
      .replace(
        /-/g,
        ""
      );

  if (
    [
      "1x",
      "x1",
      "homedraw",
      "homeordraw",
    ].includes(texto)
  ) {
    return "casa";
  }

  if (
    [
      "x2",
      "2x",
      "drawaway",
      "draworaway",
    ].includes(texto)
  ) {
    return "visitante";
  }

  return null;
}

function obterTendenciaGols(
  previsao:
    PrevisaoApi
) {
  const tendencia =
    previsao.predictions
      .under_over;

  if (!tendencia) {
    return null;
  }

  const linha =
    extrairNumero(
      tendencia
    );

  if (
    linha === null
  ) {
    return null;
  }

  const texto =
    String(
      tendencia
    ).trim();

  const direcao =
    texto.startsWith("-")
      ? "under"
      : "over";

  return {
    direcao,
    linha,
  };
}

function obterTendenciaAmbas(
  previsao:
    PrevisaoApi
) {
  const golsCasa =
    extrairNumero(
      previsao.predictions
        .goals.home
    );

  const golsVisitante =
    extrairNumero(
      previsao.predictions
        .goals.away
    );

  if (
    golsCasa === null ||
    golsVisitante === null
  ) {
    return null;
  }

  if (
    golsCasa >= 1 &&
    golsVisitante >= 1
  ) {
    return "sim";
  }

  if (
    golsCasa < 1 ||
    golsVisitante < 1
  ) {
    return "nao";
  }

  return null;
}

function criarDicaDoCandidato(
  analise:
    AnalisePartida,
  candidato:
    CandidatoOdd
): DicaSelecionada | null {
  const {
    partida,
    previsao,
    competicao,
  } = analise;

  const percentualCasa =
    converterPercentual(
      previsao.predictions
        .percent.home
    );

  const percentualEmpate =
    converterPercentual(
      previsao.predictions
        .percent.draw
    );

  const percentualVisitante =
    converterPercentual(
      previsao.predictions
        .percent.away
    );

  let probabilidade =
    calcularProbabilidadeImplicita(
      candidato.odd
    );

  let pontuacao =
    probabilidade;

  let justificativa = "";

  let entradaSugerida =
    formatarSelecaoMercado(
      candidato.categoria,
      candidato.selecao
    );

  if (
    candidato.categoria ===
      "resultado"
  ) {
    const lado =
      identificarLadoResultado(
        candidato.selecao
      );

    if (!lado) {
      return null;
    }

    if (
      lado === "casa"
    ) {
      probabilidade =
        percentualCasa;

      entradaSugerida =
        `Vitória de ${partida.teams.home.name}`;
    } else if (
      lado === "visitante"
    ) {
      probabilidade =
        percentualVisitante;

      entradaSugerida =
        `Vitória de ${partida.teams.away.name}`;
    } else {
      probabilidade =
        percentualEmpate;

      entradaSugerida =
        "Empate";
    }

    if (
      probabilidade < 45
    ) {
      return null;
    }

    pontuacao =
      probabilidade + 12;

    justificativa =
      `Probabilidades estimadas: ${partida.teams.home.name} ${percentualCasa}%, empate ${percentualEmpate}% e ${partida.teams.away.name} ${percentualVisitante}%.`;
  }

  if (
    candidato.categoria ===
      "dupla"
  ) {
    const lado =
      identificarLadoDupla(
        candidato.selecao
      );

    if (!lado) {
      return null;
    }

    if (
      lado === "casa"
    ) {
      probabilidade =
        Math.min(
          percentualCasa +
            percentualEmpate,
          90
        );

      entradaSugerida =
        `${partida.teams.home.name} ou empate`;
    } else {
      probabilidade =
        Math.min(
          percentualVisitante +
            percentualEmpate,
          90
        );

      entradaSugerida =
        `${partida.teams.away.name} ou empate`;
    }

    if (
      probabilidade < 55
    ) {
      return null;
    }

    pontuacao =
      probabilidade + 10;

    justificativa =
      "A dupla possibilidade combina as probabilidades de vitória e empate indicadas pela análise da API.";
  }

  if (
    candidato.categoria ===
      "gols"
  ) {
    const tendencia =
      obterTendenciaGols(
        previsao
      );

    if (!tendencia) {
      return null;
    }

    const selecaoNormalizada =
      normalizarTexto(
        candidato.selecao
      );

    const linhaCandidato =
      extrairNumero(
        candidato.selecao
      );

    const candidatoOver =
      selecaoNormalizada.includes(
        "over"
      );

    const candidatoUnder =
      selecaoNormalizada.includes(
        "under"
      );

    const direcaoCorreta =
      (
        tendencia.direcao ===
          "over" &&
        candidatoOver
      ) ||
      (
        tendencia.direcao ===
          "under" &&
        candidatoUnder
      );

    if (
      !direcaoCorreta ||
      linhaCandidato === null
    ) {
      return null;
    }

    const diferencaLinha =
      Math.abs(
        linhaCandidato -
          tendencia.linha
      );

    if (
      diferencaLinha > 1
    ) {
      return null;
    }

    probabilidade =
      Math.max(
        probabilidade,
        diferencaLinha <= 0.5
          ? 62
          : 57
      );

    pontuacao =
      probabilidade + 14;

    justificativa =
      `A previsão da API indica tendência de ${
        tendencia.direcao ===
        "over"
          ? "mais"
          : "menos"
      } de ${tendencia.linha
        .toFixed(1)
        .replace(
          ".",
          ","
        )} gols.`;
  }

  if (
    candidato.categoria ===
      "ambas"
  ) {
    const tendencia =
      obterTendenciaAmbas(
        previsao
      );

    if (!tendencia) {
      return null;
    }

    const selecao =
      normalizarTexto(
        candidato.selecao
      );

    const candidatoSim =
      selecao ===
        "yes" ||
      selecao ===
        "sim";

    const candidatoNao =
      selecao ===
        "no" ||
      selecao ===
        "nao";

    const corresponde =
      (
        tendencia ===
          "sim" &&
        candidatoSim
      ) ||
      (
        tendencia ===
          "nao" &&
        candidatoNao
      );

    if (!corresponde) {
      return null;
    }

    probabilidade =
      Math.max(
        probabilidade,
        57
      );

    pontuacao =
      probabilidade + 11;

    justificativa =
      tendencia ===
        "sim"
        ? "A projeção de gols aponta possibilidade de as duas equipes marcarem."
        : "A projeção de gols indica que pelo menos uma equipe pode não marcar.";
  }

  if (
    candidato.categoria ===
      "escanteios"
  ) {
    if (
      candidato.odd >
      2.2
    ) {
      return null;
    }

    probabilidade =
      Math.min(
        probabilidade,
        62
      );

    pontuacao =
      probabilidade + 5;

    justificativa =
      "Entrada baseada na linha de escanteios disponibilizada pelas casas de apostas. A API de previsão não fornece uma projeção direta de escanteios.";
  }

  if (
    candidato.categoria ===
      "cartoes"
  ) {
    if (
      candidato.odd >
      2.2
    ) {
      return null;
    }

    probabilidade =
      Math.min(
        probabilidade,
        60
      );

    pontuacao =
      probabilidade + 4;

    justificativa =
      "Entrada baseada na linha de cartões disponibilizada pelas casas de apostas. A API de previsão não fornece uma projeção direta de cartões.";
  }

  if (
    previsao.predictions
      .advice
  ) {
    justificativa +=
      `\nAnálise da API: ${previsao.predictions.advice}.`;
  }

  const {
    dataJogo,
    horarioJogo,
  } = formatarDataHora(
    partida.fixture.date
  );

  const agora =
    new Date()
      .toISOString();

  const nomesMercados:
    Record<
      CategoriaMercado,
      string
    > = {
    resultado:
      "Resultado da partida",

    dupla:
      "Dupla possibilidade",

    gols:
      "Total de gols",

    ambas:
      "Ambas as equipes marcam",

    escanteios:
      "Total de escanteios",

    cartoes:
      "Total de cartões",
  };

  return {
    fixtureId:
      partida.fixture.id,

    categoria:
      candidato.categoria,

    prioridadeCompeticao:
      competicao.prioridade,

    esporte:
      "Futebol",

    competicao:
      competicao.nomeExibicao,

    time_casa:
      partida.teams.home.name,

    time_visitante:
      partida.teams.away.name,

    data_jogo:
      dataJogo,

    horario_jogo:
      horarioJogo,

    mercado:
      nomesMercados[
        candidato.categoria
      ],

    entrada_sugerida:
      entradaSugerida,

    odd:
      candidato.odd,

    probabilidade_estimada:
      Number(
        probabilidade.toFixed(
          1
        )
      ),

    nivel_confianca:
      classificarConfianca(
        probabilidade
      ),

    justificativa,

    fonte_dados:
      `API-Football • ${candidato.bookmaker}`,

    status:
      "ativa",

    resultado:
      "pendente",

    lucro_prejuizo:
      0,

    destaque:
      probabilidade >= 70,

    publicada_em:
      agora,

    atualizada_em:
      agora,

    pontuacao:
      Number(
        pontuacao.toFixed(
          1
        )
      ),
  };
}

function selecionarDicasFinais(
  dicas:
    DicaSelecionada[]
) {
  const ordenadas = [
    ...dicas,
  ].sort((a, b) => {
    if (
      a.prioridadeCompeticao !==
      b.prioridadeCompeticao
    ) {
      return (
        a.prioridadeCompeticao -
        b.prioridadeCompeticao
      );
    }

    return (
      b.pontuacao -
      a.pontuacao
    );
  });

  const selecionadas:
    DicaSelecionada[] = [];

  const quantidadePorPartida =
    new Map<
      number,
      number
    >();

  const quantidadePorCategoria =
    new Map<
      CategoriaMercado,
      number
    >();

  const chaves =
    new Set<string>();

  for (
    const dica of
    ordenadas
  ) {
    if (
      selecionadas.length >=
      LIMITE_DICAS_PUBLICADAS
    ) {
      break;
    }

    const totalPartida =
      quantidadePorPartida.get(
        dica.fixtureId
      ) ?? 0;

    const totalCategoria =
      quantidadePorCategoria.get(
        dica.categoria
      ) ?? 0;

    if (
      totalPartida >=
        LIMITE_DICAS_POR_PARTIDA ||
      totalCategoria >=
        LIMITE_DICAS_POR_CATEGORIA
    ) {
      continue;
    }

    const chave =
      `${dica.fixtureId}|${dica.mercado}|${normalizarTexto(
        dica.entrada_sugerida
      )}`;

    if (
      chaves.has(chave)
    ) {
      continue;
    }

    chaves.add(chave);

    selecionadas.push(
      dica
    );

    quantidadePorPartida.set(
      dica.fixtureId,
      totalPartida + 1
    );

    quantidadePorCategoria.set(
      dica.categoria,
      totalCategoria + 1
    );
  }

  return selecionadas;
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
    const dataInicial =
      obterDataBrasilia(0);

    const dataFinal =
      obterDataBrasilia(1);

    const dadosHoje =
      await consultarApi<RespostaPartidas>(
        `/fixtures?date=${dataInicial}&timezone=America%2FSao_Paulo`,
        chaveApi
      );

    if (
      possuiErrosApi(
        dadosHoje.errors
      )
    ) {
      throw new Error(
        `Erro ao buscar partidas de hoje: ${JSON.stringify(
          dadosHoje.errors
        )}`
      );
    }

    await aguardar(
      INTERVALO_REQUISICOES_MS
    );

    const dadosAmanha =
      await consultarApi<RespostaPartidas>(
        `/fixtures?date=${dataFinal}&timezone=America%2FSao_Paulo`,
        chaveApi
      );

    if (
      possuiErrosApi(
        dadosAmanha.errors
      )
    ) {
      throw new Error(
        `Erro ao buscar partidas de amanhã: ${JSON.stringify(
          dadosAmanha.errors
        )}`
      );
    }

    const todasPartidas = [
      ...(
        dadosHoje.response ??
        []
      ),

      ...(
        dadosAmanha.response ??
        []
      ),
    ];

    const partidasPermitidas =
      todasPartidas
        .filter(
          (partida) => {
            const aindaNaoIniciada =
              partida.fixture
                .status
                .short ===
              "NS";

            const competicaoPermitida =
              MAPA_COMPETICOES.has(
                partida.league.id
              );

            return (
              aindaNaoIniciada &&
              competicaoPermitida
            );
          }
        )
        .sort((a, b) => {
          const prioridadeA =
            MAPA_COMPETICOES.get(
              a.league.id
            )?.prioridade ??
            999;

          const prioridadeB =
            MAPA_COMPETICOES.get(
              b.league.id
            )?.prioridade ??
            999;

          if (
            prioridadeA !==
            prioridadeB
          ) {
            return (
              prioridadeA -
              prioridadeB
            );
          }

          return (
            new Date(
              a.fixture.date
            ).getTime() -
            new Date(
              b.fixture.date
            ).getTime()
          );
        });

    const partidasAnalisadas =
      partidasPermitidas.slice(
        0,
        LIMITE_PARTIDAS_ANALISADAS
      );

    const analises:
      AnalisePartida[] = [];

    let errosPrevisao =
      0;

    for (
      const partida of
      partidasAnalisadas
    ) {
      const competicao =
        MAPA_COMPETICOES.get(
          partida.league.id
        );

      if (!competicao) {
        continue;
      }

      try {
        await aguardar(
          INTERVALO_REQUISICOES_MS
        );

        const dadosPrevisao =
          await consultarApi<RespostaPrevisao>(
            `/predictions?fixture=${partida.fixture.id}`,
            chaveApi
          );

        if (
          possuiErrosApi(
            dadosPrevisao.errors
          )
        ) {
          errosPrevisao +=
            1;

          console.error(
            "Erro da API ao buscar previsão:",
            dadosPrevisao.errors
          );

          continue;
        }

        const previsao =
          dadosPrevisao
            .response?.[0];

        if (!previsao) {
          continue;
        }

        analises.push({
          partida,
          previsao,
          competicao,
        });
      } catch (error) {
        errosPrevisao +=
          1;

        console.error(
          "Erro na previsão:",
          error
        );
      }
    }

    const candidatos:
      DicaSelecionada[] =
      [];

    let consultasOdds =
      0;

    let errosOdds =
      0;

    let mercadosEncontrados =
      0;

    const categoriasEncontradas =
      new Set<
        CategoriaMercado
      >();

    for (
      const analise of
      analises
    ) {
      try {
        await aguardar(
          INTERVALO_REQUISICOES_MS
        );

        const dadosOdds =
          await consultarApi<RespostaOdds>(
            `/odds?fixture=${analise.partida.fixture.id}`,
            chaveApi
          );

        consultasOdds +=
          1;

        if (
          possuiErrosApi(
            dadosOdds.errors
          )
        ) {
          errosOdds +=
            1;

          console.error(
            "Erro da API ao buscar odds:",
            dadosOdds.errors
          );

          continue;
        }

        const candidatosOdds =
          coletarCandidatosOdds(
            dadosOdds
          );

        mercadosEncontrados +=
          candidatosOdds.length;

        for (
          const candidatoOdd of
          candidatosOdds
        ) {
          categoriasEncontradas.add(
            candidatoOdd.categoria
          );

          const dica =
            criarDicaDoCandidato(
              analise,
              candidatoOdd
            );

          if (dica) {
            candidatos.push(
              dica
            );
          }
        }
      } catch (error) {
        errosOdds +=
          1;

        console.error(
          "Erro ao buscar odds:",
          error
        );
      }
    }

    const dicasSelecionadas =
      selecionarDicasFinais(
        candidatos
      );

    const supabase =
      createAdminClient();

    const {
      error:
        erroEncerrar,
    } = await supabase
      .from(
        "dicas_apostas"
      )
      .update({
        status:
          "encerrada",
      })
      .eq(
        "status",
        "ativa"
      )
      .lt(
        "data_jogo",
        dataInicial
      );

    if (
      erroEncerrar
    ) {
      console.error(
        "Erro ao encerrar dicas antigas:",
        erroEncerrar
      );
    }

    let dicasInseridas =
      0;

    let dicasAtualizadas =
      0;

    let errosInsercao =
      0;

    for (
      const dica of
      dicasSelecionadas
    ) {
      const {
        fixtureId,

        categoria:
          _categoria,

        prioridadeCompeticao:
          _prioridade,

        pontuacao:
          _pontuacao,

        ...dadosBanco
      } = dica;

      const dadosBancoComFixture = {
        ...dadosBanco,

        fixture_id:
          fixtureId,
      };

      const {
        data:
          existente,

        error:
          erroConsulta,
      } = await supabase
        .from(
          "dicas_apostas"
        )
        .select("id")
        .eq(
          "data_jogo",
          dica.data_jogo
        )
        .eq(
          "time_casa",
          dica.time_casa
        )
        .eq(
          "time_visitante",
          dica.time_visitante
        )
        .eq(
          "entrada_sugerida",
          dica.entrada_sugerida
        )
        .maybeSingle();

      if (
        erroConsulta
      ) {
        errosInsercao +=
          1;

        console.error(
          "Erro ao procurar dica existente:",
          erroConsulta
        );

        continue;
      }

      if (
        existente
      ) {
        const {
          error:
            erroAtualizar,
        } = await supabase
          .from(
            "dicas_apostas"
          )
          .update({
            ...dadosBancoComFixture,

            atualizada_em:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            existente.id
          );

        if (
          erroAtualizar
        ) {
          errosInsercao +=
            1;

          console.error(
            "Erro ao atualizar dica:",
            erroAtualizar
          );
        } else {
          dicasAtualizadas +=
            1;
        }

        continue;
      }

      const {
        error:
          erroInserir,
      } = await supabase
        .from(
          "dicas_apostas"
        )
        .insert(
          dadosBancoComFixture
        );

      if (
        erroInserir
      ) {
        errosInsercao +=
          1;

        console.error(
          "Erro ao inserir dica:",
          erroInserir
        );
      } else {
        dicasInseridas +=
          1;
      }
    }

    const campeonatosEncontrados =
      Array.from(
        new Set(
          partidasPermitidas.map(
            (partida) =>
              MAPA_COMPETICOES.get(
                partida.league.id
              )?.nomeExibicao ??
              partida.league.name
          )
        )
      );

    const campeonatosAnalisados =
      Array.from(
        new Set(
          partidasAnalisadas.map(
            (partida) =>
              MAPA_COMPETICOES.get(
                partida.league.id
              )?.nomeExibicao ??
              partida.league.name
          )
        )
      );

    return NextResponse.json({
      sucesso: true,

      periodoConsultado: {
        inicio:
          dataInicial,
        fim:
          dataFinal,
      },

      intervaloRequisicoesSegundos:
        INTERVALO_REQUISICOES_MS /
        1000,

      partidasTotaisEncontradas:
        todasPartidas.length,

      partidasCampeonatosPermitidos:
        partidasPermitidas.length,

      partidasAnalisadas:
        partidasAnalisadas.length,

      campeonatosEncontrados,

      campeonatosAnalisados,

      previsoesEncontradas:
        analises.length,

      consultasOdds,

      oddsEncontradas:
        consultasOdds,

      mercadosEncontrados,

      categoriasEncontradas:
        Array.from(
          categoriasEncontradas
        ),

      candidatosGerados:
        candidatos.length,

      dicasSelecionadas:
        dicasSelecionadas.length,

      dicasInseridas,

      dicasAtualizadas,

      errosPrevisao,

      errosOdds,

      errosInsercao,

      dicasPublicadas:
        dicasSelecionadas.map(
          (dica) => ({
            fixtureId:
              dica.fixtureId,

            confronto:
              `${dica.time_casa} x ${dica.time_visitante}`,

            mercado:
              dica.mercado,

            entrada:
              dica.entrada_sugerida,

            odd:
              dica.odd,

            probabilidade:
              dica.probabilidade_estimada,

            fonte:
              dica.fonte_dados,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar dicas:",
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