export type StatusParcelamento =
  | "ativo"
  | "concluido"
  | "cancelado";

export type Parcelamento = {
  id: number;
  user_id: string;
  descricao: string;
  categoria: string;
  valor_total: number;
  quantidade_parcelas: number;
  valor_parcela: number;
  data_primeira_parcela: string;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type ParcelaMovimentacao = {
  id: number;
  user_id: string;
  tipo: "despesa";
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  observacao: string | null;
  parcelamento_id: number;
  numero_parcela: number;
  total_parcelas: number;
  competencia: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type FormularioParcelamento = {
  descricao: string;
  categoria: string;
  valorTotal: string;
  quantidadeParcelas: string;
  dataPrimeiraParcela: string;
  observacao: string;
};

export type NovoParcelamento = {
  descricao: string;
  categoria: string;
  valor_total: number;
  quantidade_parcelas: number;
  valor_parcela: number;
  data_primeira_parcela: string;
  observacao: string | null;
};

export type AtualizarParcelamento = {
  descricao?: string;
  categoria?: string;
  valor_total?: number;
  quantidade_parcelas?: number;
  valor_parcela?: number;
  data_primeira_parcela?: string;
  observacao?: string | null;
  ativo?: boolean;
  updated_at?: string;
};

export type FiltrosParcelamentos = {
  busca: string;
  categoria: string;
  status: "todos" | StatusParcelamento;
};

export type ResumoParcelamentos = {
  valorTotal: number;
  valorMensal: number;
  quantidadeAtivos: number;
  quantidadeParcelasRestantes: number;
};

export const CATEGORIAS_PARCELAMENTOS = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Eletrônicos",
  "Móveis",
  "Vestuário",
  "Cartão",
  "Viagem",
  "Assinaturas",
  "Compras",
  "Outros",
] as const;

export const QUANTIDADES_PARCELAS = Array.from(
  { length: 119 },
  (_, indice) => indice + 2
);

function obterDataLocalAtual() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export const FORMULARIO_PARCELAMENTO_INICIAL: FormularioParcelamento =
  {
    descricao: "",
    categoria: "",
    valorTotal: "",
    quantidadeParcelas: "2",
    dataPrimeiraParcela: obterDataLocalAtual(),
    observacao: "",
  };

export function converterValorMonetario(valor: string) {
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

export function calcularValorParcela(
  valorTotal: number,
  quantidadeParcelas: number
) {
  if (
    !Number.isFinite(valorTotal) ||
    valorTotal <= 0 ||
    !Number.isInteger(quantidadeParcelas) ||
    quantidadeParcelas < 2
  ) {
    return 0;
  }

  return Math.floor(
    (valorTotal / quantidadeParcelas) * 100
  ) / 100;
}

export function converterFormularioParaParcelamento(
  formulario: FormularioParcelamento
): NovoParcelamento {
  const valorTotal = converterValorMonetario(
    formulario.valorTotal
  );

  const quantidadeParcelas = Number(
    formulario.quantidadeParcelas
  );

  const valorParcela = calcularValorParcela(
    valorTotal,
    quantidadeParcelas
  );

  return {
    descricao: formulario.descricao.trim(),
    categoria: formulario.categoria,
    valor_total: valorTotal,
    quantidade_parcelas: quantidadeParcelas,
    valor_parcela: valorParcela,
    data_primeira_parcela:
      formulario.dataPrimeiraParcela,
    observacao:
      formulario.observacao.trim() || null,
  };
}

export function adicionarMesesNaData(
  dataInicial: string,
  quantidadeMeses: number
) {
  const [ano, mes, dia] = dataInicial
    .split("-")
    .map(Number);

  const data = new Date(
    ano,
    mes - 1 + quantidadeMeses,
    1
  );

  const ultimoDiaDoMes = new Date(
    data.getFullYear(),
    data.getMonth() + 1,
    0
  ).getDate();

  const diaAjustado = Math.min(
    dia,
    ultimoDiaDoMes
  );

  const anoFinal = data.getFullYear();
  const mesFinal = String(
    data.getMonth() + 1
  ).padStart(2, "0");

  const diaFinal = String(diaAjustado).padStart(
    2,
    "0"
  );

  return `${anoFinal}-${mesFinal}-${diaFinal}`;
}

export function calcularValorDaParcela(
  valorTotal: number,
  quantidadeParcelas: number,
  numeroParcela: number
) {
  const valorBase = calcularValorParcela(
    valorTotal,
    quantidadeParcelas
  );

  if (numeroParcela < quantidadeParcelas) {
    return valorBase;
  }

  const somaParcelasAnteriores =
    valorBase * (quantidadeParcelas - 1);

  return Number(
    (
      valorTotal - somaParcelasAnteriores
    ).toFixed(2)
  );
}

export function gerarParcelasMovimentacoes({
  userId,
  parcelamentoId,
  parcelamento,
}: {
  userId: string;
  parcelamentoId: number;
  parcelamento: NovoParcelamento;
}) {
  return Array.from(
    {
      length: parcelamento.quantidade_parcelas,
    },
    (_, indice) => {
      const numeroParcela = indice + 1;

      const dataParcela = adicionarMesesNaData(
        parcelamento.data_primeira_parcela,
        indice
      );

      return {
        user_id: userId,
        tipo: "despesa" as const,
        descricao: `${parcelamento.descricao} (${numeroParcela}/${parcelamento.quantidade_parcelas})`,
        categoria: parcelamento.categoria,
        valor: calcularValorDaParcela(
          parcelamento.valor_total,
          parcelamento.quantidade_parcelas,
          numeroParcela
        ),
        data: dataParcela,
        observacao: parcelamento.observacao,
        parcelamento_id: parcelamentoId,
        numero_parcela: numeroParcela,
        total_parcelas:
          parcelamento.quantidade_parcelas,
        competencia: dataParcela.slice(0, 7),
      };
    }
  );
}

export function obterStatusParcelamento(
  parcelamento: Parcelamento
): StatusParcelamento {
  if (!parcelamento.ativo) {
    return "cancelado";
  }

  const dataFinal = adicionarMesesNaData(
    parcelamento.data_primeira_parcela,
    parcelamento.quantidade_parcelas - 1
  );

  const hoje = obterDataLocalAtual();

  if (dataFinal < hoje) {
    return "concluido";
  }

  return "ativo";
}