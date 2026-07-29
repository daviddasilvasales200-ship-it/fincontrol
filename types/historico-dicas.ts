import type {
  DicaAposta,
  ResultadoDica,
} from "@/types/dica-aposta";

export type PeriodoHistorico =
  | "todos"
  | "7_dias"
  | "30_dias";

export type DesempenhoAgrupado = {
  nome: string;

  total: number;
  ganhas: number;
  perdidas: number;
  anuladas: number;
  pendentes: number;

  finalizadas: number;

  taxaAcerto: number;
  lucroPrejuizo: number;
};

export type ResumoHistoricoDicas = {
  total: number;

  ganhas: number;
  perdidas: number;
  anuladas: number;
  pendentes: number;

  finalizadas: number;

  taxaAcerto: number;
  lucroPrejuizo: number;

  oddMedia: number;
  probabilidadeMedia: number;

  melhorMercado:
    | DesempenhoAgrupado
    | null;

  piorMercado:
    | DesempenhoAgrupado
    | null;
};

export type HistoricoDicasCalculado = {
  dicas: DicaAposta[];

  resumo:
    ResumoHistoricoDicas;

  porMercado:
    DesempenhoAgrupado[];

  porCompeticao:
    DesempenhoAgrupado[];
};

function arredondar(
  valor: number,
  casas = 2
) {
  if (!Number.isFinite(valor)) {
    return 0;
  }

  const fator =
    10 ** casas;

  return (
    Math.round(
      valor * fator
    ) / fator
  );
}

function dataReferenciaDica(
  dica: DicaAposta
) {
  const valor =
    dica.resultado_verificado_em ??
    dica.atualizada_em ??
    dica.publicada_em ??
    dica.created_at;

  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    const dataJogo =
      new Date(
        `${dica.data_jogo}T12:00:00`
      );

    return Number.isNaN(
      dataJogo.getTime()
    )
      ? null
      : dataJogo;
  }

  return data;
}

function inicioHojeBrasilia() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Sao_Paulo",

        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const ano =
    partes.find(
      (parte) =>
        parte.type === "year"
    )?.value;

  const mes =
    partes.find(
      (parte) =>
        parte.type === "month"
    )?.value;

  const dia =
    partes.find(
      (parte) =>
        parte.type === "day"
    )?.value;

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return new Date();
  }

  return new Date(
    `${ano}-${mes}-${dia}T00:00:00-03:00`
  );
}

export function filtrarDicasPorPeriodo(
  dicas: DicaAposta[],
  periodo: PeriodoHistorico
) {
  if (periodo === "todos") {
    return [...dicas];
  }

  const quantidadeDias =
    periodo === "7_dias"
      ? 7
      : 30;

  const limite =
    inicioHojeBrasilia();

  limite.setDate(
    limite.getDate() -
      (quantidadeDias - 1)
  );

  return dicas.filter(
    (dica) => {
      const data =
        dataReferenciaDica(
          dica
        );

      return (
        data !== null &&
        data.getTime() >=
          limite.getTime()
      );
    }
  );
}

function contarResultado(
  dicas: DicaAposta[],
  resultado: ResultadoDica
) {
  return dicas.filter(
    (dica) =>
      dica.resultado ===
      resultado
  ).length;
}

function calcularTaxaAcerto(
  ganhas: number,
  perdidas: number
) {
  const finalizadas =
    ganhas + perdidas;

  if (
    finalizadas === 0
  ) {
    return 0;
  }

  return arredondar(
    (ganhas / finalizadas) *
      100,
    1
  );
}

function calcularLucroPrejuizo(
  dicas: DicaAposta[]
) {
  return arredondar(
    dicas.reduce(
      (
        total,
        dica
      ) =>
        total +
        Number(
          dica.lucro_prejuizo ??
            0
        ),
      0
    )
  );
}

function calcularOddMedia(
  dicas: DicaAposta[]
) {
  const dicasComOdd =
    dicas.filter(
      (dica) =>
        Number.isFinite(
          Number(dica.odd)
        ) &&
        Number(dica.odd) >
          0
    );

  if (
    dicasComOdd.length === 0
  ) {
    return 0;
  }

  const total =
    dicasComOdd.reduce(
      (
        soma,
        dica
      ) =>
        soma +
        Number(dica.odd),
      0
    );

  return arredondar(
    total /
      dicasComOdd.length
  );
}

function calcularProbabilidadeMedia(
  dicas: DicaAposta[]
) {
  const registros =
    dicas.filter(
      (dica) =>
        dica.probabilidade_estimada !==
          null &&
        Number.isFinite(
          Number(
            dica.probabilidade_estimada
          )
        )
    );

  if (
    registros.length === 0
  ) {
    return 0;
  }

  const total =
    registros.reduce(
      (
        soma,
        dica
      ) =>
        soma +
        Number(
          dica.probabilidade_estimada
        ),
      0
    );

  return arredondar(
    total /
      registros.length,
    1
  );
}

function criarDesempenhoAgrupado(
  nome: string,
  dicas: DicaAposta[]
): DesempenhoAgrupado {
  const ganhas =
    contarResultado(
      dicas,
      "ganha"
    );

  const perdidas =
    contarResultado(
      dicas,
      "perdida"
    );

  const anuladas =
    contarResultado(
      dicas,
      "anulada"
    );

  const pendentes =
    contarResultado(
      dicas,
      "pendente"
    );

  const finalizadas =
    ganhas + perdidas;

  return {
    nome,

    total:
      dicas.length,

    ganhas,
    perdidas,
    anuladas,
    pendentes,

    finalizadas,

    taxaAcerto:
      calcularTaxaAcerto(
        ganhas,
        perdidas
      ),

    lucroPrejuizo:
      calcularLucroPrejuizo(
        dicas
      ),
  };
}

function agruparDicas(
  dicas: DicaAposta[],
  obterNome: (
    dica: DicaAposta
  ) => string
) {
  const grupos =
    new Map<
      string,
      DicaAposta[]
    >();

  for (
    const dica of dicas
  ) {
    const nome =
      obterNome(dica)
        .trim() ||
      "Não informado";

    const registros =
      grupos.get(nome) ??
      [];

    registros.push(dica);

    grupos.set(
      nome,
      registros
    );
  }

  return Array.from(
    grupos.entries()
  ).map(
    ([nome, registros]) =>
      criarDesempenhoAgrupado(
        nome,
        registros
      )
  );
}

function ordenarDesempenho(
  itens:
    DesempenhoAgrupado[]
) {
  return [...itens].sort(
    (a, b) => {
      if (
        b.lucroPrejuizo !==
        a.lucroPrejuizo
      ) {
        return (
          b.lucroPrejuizo -
          a.lucroPrejuizo
        );
      }

      if (
        b.taxaAcerto !==
        a.taxaAcerto
      ) {
        return (
          b.taxaAcerto -
          a.taxaAcerto
        );
      }

      return (
        b.finalizadas -
        a.finalizadas
      );
    }
  );
}

function selecionarMelhorMercado(
  mercados:
    DesempenhoAgrupado[]
) {
  const elegiveis =
    mercados.filter(
      (mercado) =>
        mercado.finalizadas >
        0
    );

  if (
    elegiveis.length === 0
  ) {
    return null;
  }

  return [...elegiveis].sort(
    (a, b) => {
      if (
        b.lucroPrejuizo !==
        a.lucroPrejuizo
      ) {
        return (
          b.lucroPrejuizo -
          a.lucroPrejuizo
        );
      }

      return (
        b.taxaAcerto -
        a.taxaAcerto
      );
    }
  )[0];
}

function selecionarPiorMercado(
  mercados:
    DesempenhoAgrupado[]
) {
  const elegiveis =
    mercados.filter(
      (mercado) =>
        mercado.finalizadas >
        0
    );

  if (
    elegiveis.length === 0
  ) {
    return null;
  }

  return [...elegiveis].sort(
    (a, b) => {
      if (
        a.lucroPrejuizo !==
        b.lucroPrejuizo
      ) {
        return (
          a.lucroPrejuizo -
          b.lucroPrejuizo
        );
      }

      return (
        a.taxaAcerto -
        b.taxaAcerto
      );
    }
  )[0];
}

export function calcularHistoricoDicas(
  dicasOriginais:
    DicaAposta[],

  periodo:
    PeriodoHistorico =
      "todos"
): HistoricoDicasCalculado {
  const dicas =
    filtrarDicasPorPeriodo(
      dicasOriginais,
      periodo
    );

  const ganhas =
    contarResultado(
      dicas,
      "ganha"
    );

  const perdidas =
    contarResultado(
      dicas,
      "perdida"
    );

  const anuladas =
    contarResultado(
      dicas,
      "anulada"
    );

  const pendentes =
    contarResultado(
      dicas,
      "pendente"
    );

  const finalizadas =
    ganhas + perdidas;

  const porMercado =
    ordenarDesempenho(
      agruparDicas(
        dicas,
        (dica) =>
          dica.mercado
      )
    );

  const porCompeticao =
    ordenarDesempenho(
      agruparDicas(
        dicas,
        (dica) =>
          dica.competicao
      )
    );

  return {
    dicas,

    resumo: {
      total:
        dicas.length,

      ganhas,
      perdidas,
      anuladas,
      pendentes,

      finalizadas,

      taxaAcerto:
        calcularTaxaAcerto(
          ganhas,
          perdidas
        ),

      lucroPrejuizo:
        calcularLucroPrejuizo(
          dicas
        ),

      oddMedia:
        calcularOddMedia(
          dicas
        ),

      probabilidadeMedia:
        calcularProbabilidadeMedia(
          dicas
        ),

      melhorMercado:
        selecionarMelhorMercado(
          porMercado
        ),

      piorMercado:
        selecionarPiorMercado(
          porMercado
        ),
    },

    porMercado,

    porCompeticao,
  };
}

export function formatarUnidadesHistorico(
  valor: number
) {
  const numero =
    Number.isFinite(valor)
      ? valor
      : 0;

  const texto =
    new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(
      Math.abs(numero)
    );

  if (numero > 0) {
    return `+${texto} un`;
  }

  if (numero < 0) {
    return `-${texto} un`;
  }

  return "0,00 un";
}

export function formatarPercentualHistorico(
  valor: number
) {
  const numero =
    Number.isFinite(valor)
      ? valor
      : 0;

  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }
  ).format(numero)}%`;
}