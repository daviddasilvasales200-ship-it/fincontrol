export type StatusAssinatura =
  | "ativa"
  | "inativa";

export type Assinatura = {
  id: number;
  user_id: string;
  nome: string;
  categoria: string;
  valor: number;
  dia_vencimento: number;
  data_inicio: string;
  observacao: string | null;
  ativa: boolean;
  created_at: string;
};

export type FormularioAssinatura = {
  nome: string;
  categoria: string;
  valor: string;
  diaVencimento: string;
  dataInicio: string;
  observacao: string;
};

export type NovaAssinatura = {
  nome: string;
  categoria: string;
  valor: number;
  dia_vencimento: number;
  data_inicio: string;
  observacao: string | null;
  ativa: boolean;
};

export type AtualizarAssinatura = {
  nome?: string;
  categoria?: string;
  valor?: number;
  dia_vencimento?: number;
  data_inicio?: string;
  observacao?: string | null;
  ativa?: boolean;
};

export type FiltroStatusAssinatura =
  | "todas"
  | "ativas"
  | "inativas";

export type ResumoAssinaturas = {
  custoMensal: number;
  custoAnual: number;
  quantidadeAtivas: number;
  quantidadeInativas: number;
};

export const CATEGORIAS_ASSINATURAS = [
  "Streaming",
  "Música",
  "Software",
  "Armazenamento",
  "Telefonia",
  "Internet",
  "Academia",
  "Educação",
  "Notícias",
  "Jogos",
  "Saúde",
  "Seguros",
  "Clube",
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

export const FORMULARIO_ASSINATURA_INICIAL: FormularioAssinatura =
  {
    nome: "",
    categoria: "",
    valor: "",
    diaVencimento: String(
      new Date().getDate()
    ),
    dataInicio: obterDataLocalAtual(),
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

  const valorConvertido = Number(
    valorLimpo
  );

  return Number.isFinite(valorConvertido)
    ? valorConvertido
    : 0;
}

export function converterFormularioParaAssinatura(
  formulario: FormularioAssinatura
): NovaAssinatura {
  return {
    nome: formulario.nome.trim(),
    categoria: formulario.categoria,
    valor: converterValorMonetario(
      formulario.valor
    ),
    dia_vencimento: Number(
      formulario.diaVencimento
    ),
    data_inicio: formulario.dataInicio,
    observacao:
      formulario.observacao.trim() || null,
    ativa: true,
  };
}

export function obterStatusAssinatura(
  assinatura: Assinatura
): StatusAssinatura {
  return assinatura.ativa
    ? "ativa"
    : "inativa";
}

export function calcularResumoAssinaturas(
  assinaturas: Assinatura[]
): ResumoAssinaturas {
  const ativas = assinaturas.filter(
    (assinatura) => assinatura.ativa
  );

  const inativas = assinaturas.filter(
    (assinatura) => !assinatura.ativa
  );

  const custoMensal = ativas.reduce(
    (total, assinatura) =>
      total + Number(assinatura.valor),
    0
  );

  return {
    custoMensal,
    custoAnual: custoMensal * 12,
    quantidadeAtivas: ativas.length,
    quantidadeInativas:
      inativas.length,
  };
}

export function calcularProximaCobranca(
  assinatura: Pick<
    Assinatura,
    "dia_vencimento" | "data_inicio"
  >
) {
  const hoje = new Date();

  const [anoInicio, mesInicio, diaInicio] =
    assinatura.data_inicio
      .split("-")
      .map(Number);

  const dataInicio = new Date(
    anoInicio,
    mesInicio - 1,
    diaInicio
  );

  let ano = hoje.getFullYear();
  let mes = hoje.getMonth();

  if (dataInicio > hoje) {
    ano = dataInicio.getFullYear();
    mes = dataInicio.getMonth();
  }

  const criarDataComVencimento = (
    anoData: number,
    mesData: number
  ) => {
    const ultimoDiaDoMes = new Date(
      anoData,
      mesData + 1,
      0
    ).getDate();

    const diaAjustado = Math.min(
      Math.max(
        assinatura.dia_vencimento,
        1
      ),
      ultimoDiaDoMes
    );

    return new Date(
      anoData,
      mesData,
      diaAjustado
    );
  };

  let proximaCobranca =
    criarDataComVencimento(ano, mes);

  const hojeSemHorario = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  if (
    proximaCobranca < hojeSemHorario ||
    proximaCobranca < dataInicio
  ) {
    mes += 1;

    if (mes > 11) {
      mes = 0;
      ano += 1;
    }

    proximaCobranca =
      criarDataComVencimento(ano, mes);
  }

  const anoFinal =
    proximaCobranca.getFullYear();

  const mesFinal = String(
    proximaCobranca.getMonth() + 1
  ).padStart(2, "0");

  const diaFinal = String(
    proximaCobranca.getDate()
  ).padStart(2, "0");

  return `${anoFinal}-${mesFinal}-${diaFinal}`;
}

export function calcularDiasAteCobranca(
  dataCobranca: string
) {
  const [ano, mes, dia] = dataCobranca
    .split("-")
    .map(Number);

  const cobranca = new Date(
    ano,
    mes - 1,
    dia
  );

  const hoje = new Date();

  const hojeSemHorario = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate()
  );

  const diferenca =
    cobranca.getTime() -
    hojeSemHorario.getTime();

  return Math.max(
    Math.ceil(
      diferenca /
        (1000 * 60 * 60 * 24)
    ),
    0
  );
}

export function formatarDiaVencimento(
  dia: number
) {
  return `Todo dia ${dia}`;
}