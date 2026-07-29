export type NivelConfiancaDica =
  | "baixa"
  | "media"
  | "alta";

export type StatusDica =
  | "ativa"
  | "encerrada"
  | "cancelada";

export type ResultadoDica =
  | "pendente"
  | "ganha"
  | "perdida"
  | "anulada";

export type DicaAposta = {
  id: number;
  user_id: string | null;

  esporte: string;
  competicao: string;

  time_casa: string;
  time_visitante: string;

  data_jogo: string;
  horario_jogo: string | null;

  mercado: string;
  entrada_sugerida: string;

  odd: number;
  probabilidade_estimada: number | null;

  nivel_confianca: NivelConfiancaDica;

  justificativa: string | null;
  fonte_dados: string | null;

  status: StatusDica;
  resultado: ResultadoDica;

  lucro_prejuizo: number;

  destaque: boolean;

  publicada_em: string;
  atualizada_em: string;
  created_at: string;
};

export type FiltroStatusDica =
  | "todos"
  | StatusDica;

export type FiltroConfiancaDica =
  | "todas"
  | NivelConfiancaDica;

export type ResumoDicas = {
  total: number;
  ativas: number;
  altaConfianca: number;
  ganhas: number;
  perdidas: number;
  taxaAcerto: number;
};

export const MERCADOS_DICAS = [
  "Resultado da partida",
  "Dupla possibilidade",
  "Empate anula aposta",
  "Total de gols",
  "Ambas marcam",
  "Handicap",
  "Escanteios",
  "Cartões",
  "Finalizações",
  "Outros",
] as const;

export const NIVEIS_CONFIANCA = [
  {
    valor: "alta" as const,
    texto: "Alta",
  },
  {
    valor: "media" as const,
    texto: "Média",
  },
  {
    valor: "baixa" as const,
    texto: "Baixa",
  },
];

export function formatarNivelConfianca(
  nivel: NivelConfiancaDica
) {
  if (nivel === "alta") {
    return "Alta";
  }

  if (nivel === "media") {
    return "Média";
  }

  return "Baixa";
}

export function formatarStatusDica(
  status: StatusDica
) {
  if (status === "ativa") {
    return "Ativa";
  }

  if (status === "encerrada") {
    return "Encerrada";
  }

  return "Cancelada";
}

export function formatarResultadoDica(
  resultado: ResultadoDica
) {
  if (resultado === "ganha") {
    return "Ganha";
  }

  if (resultado === "perdida") {
    return "Perdida";
  }

  if (resultado === "anulada") {
    return "Anulada";
  }

  return "Pendente";
}

export function calcularResumoDicas(
  dicas: DicaAposta[]
): ResumoDicas {
  const ganhas = dicas.filter(
    (dica) =>
      dica.resultado === "ganha"
  ).length;

  const perdidas = dicas.filter(
    (dica) =>
      dica.resultado === "perdida"
  ).length;

  const finalizadas =
    ganhas + perdidas;

  const taxaAcerto =
    finalizadas > 0
      ? (ganhas / finalizadas) * 100
      : 0;

  return {
    total: dicas.length,

    ativas: dicas.filter(
      (dica) =>
        dica.status === "ativa"
    ).length,

    altaConfianca: dicas.filter(
      (dica) =>
        dica.nivel_confianca ===
        "alta"
    ).length,

    ganhas,
    perdidas,
    taxaAcerto,
  };
}

export function normalizarHorarioDica(
  horario: string | null
) {
  if (!horario) {
    return null;
  }

  const partes = horario.split(":");

  if (partes.length < 2) {
    return horario;
  }

  return `${partes[0]}:${partes[1]}`;
}

export function criarTextoConfronto(
  dica: Pick<
    DicaAposta,
    "time_casa" | "time_visitante"
  >
) {
  return `${dica.time_casa} x ${dica.time_visitante}`;
}