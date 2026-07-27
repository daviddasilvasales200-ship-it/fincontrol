export type TipoMovimentacao = "receita" | "despesa";

export type Movimentacao = {
  id: number;
  user_id: string;
  tipo: TipoMovimentacao;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  observacao: string | null;
  created_at: string | null;
  updated_at: string | null;
  parcelamento_id: number | null;
  numero_parcela: number | null;
  total_parcelas: number | null;
  assinatura_id: number | null;
  competencia: string | null;
};

export type NovaMovimentacao = {
  tipo: TipoMovimentacao;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  observacao?: string | null;
  competencia?: string | null;
};

export type AtualizarMovimentacao = {
  descricao?: string;
  categoria?: string;
  valor?: number;
  data?: string;
  observacao?: string | null;
  competencia?: string | null;
};

export type FormularioMovimentacao = {
  descricao: string;
  categoria: string;
  valor: string;
  data: string;
  observacao: string;
};

export type FiltrosMovimentacoes = {
  busca: string;
  categoria: string;
  mes: string;
};

function obterDataLocalAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export const FORMULARIO_MOVIMENTACAO_INICIAL: FormularioMovimentacao = {
  descricao: "",
  categoria: "",
  valor: "",
  data: obterDataLocalAtual(),
  observacao: "",
};

export const CATEGORIAS_RECEITAS = [
  "Salário",
  "Renda extra",
  "Freelance",
  "Investimentos",
  "Cashback",
  "Vendas",
  "Prêmios",
  "Outros",
] as const;

export const CATEGORIAS_DESPESAS = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Compras",
  "Assinaturas",
  "Contas",
  "Cartão de crédito",
  "Investimentos",
  "Apostas",
  "Outros",
] as const;

export function obterCategoriasPorTipo(
  tipo: TipoMovimentacao
): readonly string[] {
  return tipo === "receita"
    ? CATEGORIAS_RECEITAS
    : CATEGORIAS_DESPESAS;
}

export function converterFormularioParaMovimentacao(
  formulario: FormularioMovimentacao,
  tipo: TipoMovimentacao
): NovaMovimentacao {
  const valorConvertido = Number(
    formulario.valor
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return {
    tipo,
    descricao: formulario.descricao.trim(),
    categoria: formulario.categoria,
    valor: valorConvertido,
    data: formulario.data,
    observacao: formulario.observacao.trim() || null,
    competencia: formulario.data.slice(0, 7),
  };
}