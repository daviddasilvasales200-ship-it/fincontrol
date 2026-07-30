export type ResultadoAposta =
  | "pendente"
  | "ganha"
  | "perdida"
  | "anulada";

export type OrigemAposta = "manual" | "dica";

export type Aposta = {
  id: number;
  user_id: string;
  dica_id: number | null;
  fixture_id: number | null;
  origem: OrigemAposta;
  descricao: string;
  modalidade: string;
  competicao: string | null;
  time_casa: string | null;
  time_visitante: string | null;
  casa_aposta: string | null;
  valor_apostado: number;
  odd: number;
  retorno_potencial: number;
  resultado: ResultadoAposta;
  lucro_prejuizo: number;
  data_aposta: string;
  observacao: string | null;
  created_at: string;
  updated_at: string;
};

export type DicaParaAposta = {
  id: number;
  fixture_id: number | null;
  esporte: string;
  competicao: string;
  time_casa: string;
  time_visitante: string;
  data_jogo: string;
  mercado: string;
  entrada_sugerida: string;
  odd: number;
  resultado: ResultadoAposta;
};

export type FormularioAposta = {
  descricao: string;
  modalidade: string;
  competicao: string;
  timeCasa: string;
  timeVisitante: string;
  casaAposta: string;
  valorApostado: string;
  odd: string;
  resultado: ResultadoAposta;
  dataAposta: string;
  observacao: string;
};

export type NovaAposta = {
  dica_id: number | null;
  fixture_id: number | null;
  origem: OrigemAposta;
  descricao: string;
  modalidade: string;
  competicao: string | null;
  time_casa: string | null;
  time_visitante: string | null;
  casa_aposta: string | null;
  valor_apostado: number;
  odd: number;
  retorno_potencial: number;
  resultado: ResultadoAposta;
  lucro_prejuizo: number;
  data_aposta: string;
  observacao: string | null;
};

export type FiltroResultadoAposta = "todos" | ResultadoAposta;

export type ResumoApostas = {
  totalApostado: number;
  retornoTotal: number;
  lucroPrejuizo: number;
  roi: number;
  quantidadePendentes: number;
  quantidadeGanhas: number;
};

export const MODALIDADES_APOSTAS = [
  "Futebol",
  "Basquete",
  "Tênis",
  "Vôlei",
  "MMA",
  "Fórmula 1",
  "eSports",
  "Hipismo",
  "Beisebol",
  "Hóquei",
  "Outros",
] as const;

export const COMPETICOES_APOSTAS = [
  "Brasileirão Série A",
  "Brasileirão Série B",
  "Copa do Brasil",
  "Campeonato Carioca",
  "Campeonato Paulista",
  "Campeonato Mineiro",
  "Campeonato Gaúcho",
  "Copa Libertadores",
  "Copa Sul-Americana",
  "Champions League",
  "Europa League",
  "Premier League",
  "La Liga",
  "Serie A Italiana",
  "Bundesliga",
  "Ligue 1",
  "Mundial de Clubes",
  "Copa do Mundo",
  "Outros",
] as const;

function obterDataLocalAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export const FORMULARIO_APOSTA_INICIAL: FormularioAposta = {
  descricao: "",
  modalidade: "",
  competicao: "",
  timeCasa: "",
  timeVisitante: "",
  casaAposta: "",
  valorApostado: "",
  odd: "",
  resultado: "pendente",
  dataAposta: obterDataLocalAtual(),
  observacao: "",
};

export function criarFormularioDaDica(
  dica: DicaParaAposta
): FormularioAposta {
  return {
    descricao: `${dica.entrada_sugerida} — ${dica.time_casa} x ${dica.time_visitante}`,
    modalidade: dica.esporte || "Futebol",
    competicao: dica.competicao,
    timeCasa: dica.time_casa,
    timeVisitante: dica.time_visitante,
    casaAposta: "",
    valorApostado: "",
    odd: Number(dica.odd).toFixed(2).replace(".", ","),
    resultado: dica.resultado,
    dataAposta: obterDataLocalAtual(),
    observacao: `Entrada sugerida: ${dica.entrada_sugerida}. Mercado: ${dica.mercado}.`,
  };
}

export function converterValorMonetario(valor: string) {
  const valorLimpo = valor
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const valorConvertido = Number(valorLimpo);
  return Number.isFinite(valorConvertido) ? valorConvertido : 0;
}

export function converterOdd(valor: string) {
  const oddConvertida = Number(valor.trim().replace(",", "."));
  return Number.isFinite(oddConvertida) ? oddConvertida : 0;
}

export function calcularRetornoPotencial(
  valorApostado: number,
  odd: number
) {
  if (
    !Number.isFinite(valorApostado) ||
    !Number.isFinite(odd) ||
    valorApostado <= 0 ||
    odd < 1
  ) {
    return 0;
  }

  return Number((valorApostado * odd).toFixed(2));
}

export function calcularLucroPrejuizo(
  valorApostado: number,
  retornoPotencial: number,
  resultado: ResultadoAposta
) {
  if (resultado === "ganha") {
    return Number((retornoPotencial - valorApostado).toFixed(2));
  }

  if (resultado === "perdida") {
    return Number((-valorApostado).toFixed(2));
  }

  return 0;
}

export function converterFormularioParaAposta(
  formulario: FormularioAposta,
  vinculo?: {
    dicaId?: number | null;
    fixtureId?: number | null;
    origem?: OrigemAposta;
  }
): NovaAposta {
  const valorApostado = converterValorMonetario(formulario.valorApostado);
  const odd = converterOdd(formulario.odd);
  const retornoPotencial = calcularRetornoPotencial(valorApostado, odd);
  const lucroPrejuizo = calcularLucroPrejuizo(
    valorApostado,
    retornoPotencial,
    formulario.resultado
  );

  return {
    dica_id: vinculo?.dicaId ?? null,
    fixture_id: vinculo?.fixtureId ?? null,
    origem: vinculo?.origem ?? "manual",
    descricao: formulario.descricao.trim(),
    modalidade: formulario.modalidade,
    competicao: formulario.competicao.trim() || null,
    time_casa: formulario.timeCasa.trim() || null,
    time_visitante: formulario.timeVisitante.trim() || null,
    casa_aposta: formulario.casaAposta.trim() || null,
    valor_apostado: valorApostado,
    odd,
    retorno_potencial: retornoPotencial,
    resultado: formulario.resultado,
    lucro_prejuizo: lucroPrejuizo,
    data_aposta: formulario.dataAposta,
    observacao: formulario.observacao.trim() || null,
  };
}

export function calcularResumoApostas(apostas: Aposta[]): ResumoApostas {
  const apostasFinalizadas = apostas.filter(
    (aposta) => aposta.resultado !== "pendente"
  );

  const totalApostado = apostasFinalizadas.reduce(
    (total, aposta) => total + Number(aposta.valor_apostado),
    0
  );

  const retornoTotal = apostasFinalizadas.reduce((total, aposta) => {
    if (aposta.resultado === "ganha") {
      return total + Number(aposta.retorno_potencial);
    }

    if (aposta.resultado === "anulada") {
      return total + Number(aposta.valor_apostado);
    }

    return total;
  }, 0);

  const lucroPrejuizo = apostasFinalizadas.reduce(
    (total, aposta) => total + Number(aposta.lucro_prejuizo),
    0
  );

  const roi =
    totalApostado > 0 ? (lucroPrejuizo / totalApostado) * 100 : 0;

  return {
    totalApostado,
    retornoTotal,
    lucroPrejuizo,
    roi,
    quantidadePendentes: apostas.filter(
      (aposta) => aposta.resultado === "pendente"
    ).length,
    quantidadeGanhas: apostas.filter(
      (aposta) => aposta.resultado === "ganha"
    ).length,
  };
}
