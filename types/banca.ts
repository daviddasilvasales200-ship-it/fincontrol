export type Banca = {
  id: number;
  user_id: string;
  nome: string;
  valor_inicial: number;
  meta_mensal: number;
  limite_por_aposta: number;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

export type ResumoBanca = {
  valorInicial: number;
  saldoAtual: number;
  valorPendente: number;
  lucroPrejuizo: number;
  roi: number;
  metaMensal: number;
  progressoMeta: number;
  limitePorAposta: number;
  valorMaximoRecomendado: number;
  quantidadeApostas: number;
  quantidadePendentes: number;
  quantidadeGanhas: number;
  quantidadePerdidas: number;
  quantidadeAnuladas: number;
  taxaAcerto: number;
  maiorLucro: number;
  maiorPrejuizo: number;
};

export type ApostaParaCalculoBanca = {
  id: number;
  valor_apostado: number;
  retorno_potencial: number;
  lucro_prejuizo: number;
  resultado:
    | "pendente"
    | "ganha"
    | "perdida"
    | "anulada";
  data_aposta: string;
};

export type AnaliseRiscoAposta = {
  percentualDaBanca: number;
  limitePermitido: number;
  valorMaximoRecomendado: number;
  ultrapassouLimite: boolean;
  nivel:
    | "baixo"
    | "moderado"
    | "alto"
    | "critico";
  mensagem: string;
};

function arredondarMoeda(
  valor: number
) {
  return Number(
    valor.toFixed(2)
  );
}

function normalizarNumero(
  valor:
    | number
    | null
    | undefined
) {
  const numero = Number(
    valor ?? 0
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
}

export function calcularResumoBanca(
  banca: Banca | null,
  apostas: ApostaParaCalculoBanca[]
): ResumoBanca {
  const valorInicial =
    normalizarNumero(
      banca?.valor_inicial
    );

  const metaMensal =
    normalizarNumero(
      banca?.meta_mensal
    );

  const limitePorAposta =
    normalizarNumero(
      banca?.limite_por_aposta
    );

  const apostasFinalizadas =
    apostas.filter(
      (aposta) =>
        aposta.resultado !==
        "pendente"
    );

  const apostasPendentes =
    apostas.filter(
      (aposta) =>
        aposta.resultado ===
        "pendente"
    );

  const apostasGanhas =
    apostas.filter(
      (aposta) =>
        aposta.resultado ===
        "ganha"
    );

  const apostasPerdidas =
    apostas.filter(
      (aposta) =>
        aposta.resultado ===
        "perdida"
    );

  const apostasAnuladas =
    apostas.filter(
      (aposta) =>
        aposta.resultado ===
        "anulada"
    );

  const valorPendente =
    apostasPendentes.reduce(
      (
        total,
        aposta
      ) =>
        total +
        normalizarNumero(
          aposta.valor_apostado
        ),
      0
    );

  const lucroPrejuizo =
    apostasFinalizadas.reduce(
      (
        total,
        aposta
      ) =>
        total +
        normalizarNumero(
          aposta.lucro_prejuizo
        ),
      0
    );

  const saldoAtual =
    valorInicial +
    lucroPrejuizo;

  const totalDecisoes =
    apostasGanhas.length +
    apostasPerdidas.length;

  const taxaAcerto =
    totalDecisoes > 0
      ? (
          apostasGanhas.length /
          totalDecisoes
        ) * 100
      : 0;

  const roi =
    valorInicial > 0
      ? (
          lucroPrejuizo /
          valorInicial
        ) * 100
      : 0;

  const progressoMeta =
    metaMensal > 0
      ? (
          lucroPrejuizo /
          metaMensal
        ) * 100
      : 0;

  const valorMaximoRecomendado =
    saldoAtual > 0
      ? (
          saldoAtual *
          limitePorAposta
        ) / 100
      : 0;

  const resultados =
    apostasFinalizadas.map(
      (aposta) =>
        normalizarNumero(
          aposta.lucro_prejuizo
        )
    );

  const maiorLucro =
    resultados.length > 0
      ? Math.max(
          0,
          ...resultados
        )
      : 0;

  const maiorPrejuizo =
    resultados.length > 0
      ? Math.min(
          0,
          ...resultados
        )
      : 0;

  return {
    valorInicial:
      arredondarMoeda(
        valorInicial
      ),

    saldoAtual:
      arredondarMoeda(
        saldoAtual
      ),

    valorPendente:
      arredondarMoeda(
        valorPendente
      ),

    lucroPrejuizo:
      arredondarMoeda(
        lucroPrejuizo
      ),

    roi:
      Number(
        roi.toFixed(2)
      ),

    metaMensal:
      arredondarMoeda(
        metaMensal
      ),

    progressoMeta:
      Number(
        progressoMeta.toFixed(2)
      ),

    limitePorAposta:
      Number(
        limitePorAposta.toFixed(2)
      ),

    valorMaximoRecomendado:
      arredondarMoeda(
        valorMaximoRecomendado
      ),

    quantidadeApostas:
      apostas.length,

    quantidadePendentes:
      apostasPendentes.length,

    quantidadeGanhas:
      apostasGanhas.length,

    quantidadePerdidas:
      apostasPerdidas.length,

    quantidadeAnuladas:
      apostasAnuladas.length,

    taxaAcerto:
      Number(
        taxaAcerto.toFixed(2)
      ),

    maiorLucro:
      arredondarMoeda(
        maiorLucro
      ),

    maiorPrejuizo:
      arredondarMoeda(
        maiorPrejuizo
      ),
  };
}

export function analisarRiscoAposta(
  valorApostado: number,
  saldoAtual: number,
  limitePorAposta: number
): AnaliseRiscoAposta {
  const valorSeguro =
    normalizarNumero(
      valorApostado
    );

  const saldoSeguro =
    normalizarNumero(
      saldoAtual
    );

  const limiteSeguro =
    normalizarNumero(
      limitePorAposta
    );

  const percentualDaBanca =
    saldoSeguro > 0
      ? (
          valorSeguro /
          saldoSeguro
        ) * 100
      : 0;

  const valorMaximoRecomendado =
    saldoSeguro > 0
      ? (
          saldoSeguro *
          limiteSeguro
        ) / 100
      : 0;

  const ultrapassouLimite =
    percentualDaBanca >
    limiteSeguro;

  let nivel:
    AnaliseRiscoAposta["nivel"] =
    "baixo";

  if (
    percentualDaBanca >
    limiteSeguro * 2
  ) {
    nivel = "critico";
  } else if (
    percentualDaBanca >
    limiteSeguro
  ) {
    nivel = "alto";
  } else if (
    percentualDaBanca >
    limiteSeguro * 0.7
  ) {
    nivel = "moderado";
  }

  let mensagem =
    "O valor está dentro do limite recomendado.";

  if (nivel === "moderado") {
    mensagem =
      "O valor está próximo do limite recomendado.";
  }

  if (nivel === "alto") {
    mensagem =
      "O valor ultrapassa o limite recomendado para esta banca.";
  }

  if (nivel === "critico") {
    mensagem =
      "O valor representa um risco muito alto para a banca atual.";
  }

  return {
    percentualDaBanca:
      Number(
        percentualDaBanca.toFixed(
          2
        )
      ),

    limitePermitido:
      Number(
        limiteSeguro.toFixed(2)
      ),

    valorMaximoRecomendado:
      arredondarMoeda(
        valorMaximoRecomendado
      ),

    ultrapassouLimite,
    nivel,
    mensagem,
  };
}

export function formatarMoedaBanca(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    normalizarNumero(valor)
  );
}

export function formatarPercentualBanca(
  valor: number
) {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    normalizarNumero(valor)
  )}%`;
}