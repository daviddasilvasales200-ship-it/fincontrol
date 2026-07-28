export type StatusInvestimento =
  | "ativo"
  | "encerrado";

export type Investimento = {
  id: number;
  user_id: string;
  nome: string;
  tipo: string;
  instituicao: string | null;
  valor_aplicado: number;
  valor_atual: number;
  data_aplicacao: string;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type FormularioInvestimento = {
  nome: string;
  tipo: string;
  instituicao: string;
  valorAplicado: string;
  valorAtual: string;
  dataAplicacao: string;
  observacao: string;
};

export type NovoInvestimento = {
  nome: string;
  tipo: string;
  instituicao: string | null;
  valor_aplicado: number;
  valor_atual: number;
  data_aplicacao: string;
  observacao: string | null;
  ativo: boolean;
};

export type FiltroStatusInvestimento =
  | "todos"
  | "ativos"
  | "encerrados";

export type ResumoInvestimentos = {
  totalAplicado: number;
  valorAtual: number;
  resultado: number;
  rentabilidade: number;
  quantidadeAtivos: number;
};

export const TIPOS_INVESTIMENTOS = [
  "Poupança",
  "CDB",
  "LCI",
  "LCA",
  "Tesouro Direto",
  "Fundo de investimento",
  "Ações",
  "ETF",
  "FII",
  "Criptomoedas",
  "Previdência privada",
  "Conta remunerada",
  "Outros",
] as const;

function obterDataLocalAtual() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(
    hoje.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export const FORMULARIO_INVESTIMENTO_INICIAL: FormularioInvestimento =
  {
    nome: "",
    tipo: "",
    instituicao: "",
    valorAplicado: "",
    valorAtual: "",
    dataAplicacao: obterDataLocalAtual(),
    observacao: "",
  };

export function converterValorMonetario(
  valor: string
) {
  const valorLimpo = valor
    .trim()
    .replace(/\s/g, "")
    .replace(/R\$/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const valorConvertido = Number(valorLimpo);

  return Number.isFinite(valorConvertido)
    ? valorConvertido
    : 0;
}

export function converterFormularioParaInvestimento(
  formulario: FormularioInvestimento
): NovoInvestimento {
  const valorAplicado =
    converterValorMonetario(
      formulario.valorAplicado
    );

  const valorAtual =
    formulario.valorAtual.trim()
      ? converterValorMonetario(
          formulario.valorAtual
        )
      : valorAplicado;

  return {
    nome: formulario.nome.trim(),
    tipo: formulario.tipo,
    instituicao:
      formulario.instituicao.trim() ||
      null,
    valor_aplicado: valorAplicado,
    valor_atual: valorAtual,
    data_aplicacao:
      formulario.dataAplicacao,
    observacao:
      formulario.observacao.trim() ||
      null,
    ativo: true,
  };
}

export function calcularResultadoInvestimento(
  investimento: Pick<
    Investimento,
    "valor_aplicado" | "valor_atual"
  >
) {
  return (
    Number(investimento.valor_atual) -
    Number(investimento.valor_aplicado)
  );
}

export function calcularRentabilidadeInvestimento(
  investimento: Pick<
    Investimento,
    "valor_aplicado" | "valor_atual"
  >
) {
  const valorAplicado = Number(
    investimento.valor_aplicado
  );

  if (
    !Number.isFinite(valorAplicado) ||
    valorAplicado <= 0
  ) {
    return 0;
  }

  const resultado =
    calcularResultadoInvestimento(
      investimento
    );

  return (
    (resultado / valorAplicado) * 100
  );
}

export function calcularResumoInvestimentos(
  investimentos: Investimento[]
): ResumoInvestimentos {
  const ativos = investimentos.filter(
    (investimento) => investimento.ativo
  );

  const totalAplicado = ativos.reduce(
    (total, investimento) =>
      total +
      Number(
        investimento.valor_aplicado
      ),
    0
  );

  const valorAtual = ativos.reduce(
    (total, investimento) =>
      total +
      Number(investimento.valor_atual),
    0
  );

  const resultado =
    valorAtual - totalAplicado;

  const rentabilidade =
    totalAplicado > 0
      ? (resultado / totalAplicado) *
        100
      : 0;

  return {
    totalAplicado,
    valorAtual,
    resultado,
    rentabilidade,
    quantidadeAtivos: ativos.length,
  };
}