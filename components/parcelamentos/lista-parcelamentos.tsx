"use client";

import {
  adicionarMesesNaData,
  obterStatusParcelamento,
} from "@/types/parcelamento";

import type {
  Parcelamento,
  StatusParcelamento,
} from "@/types/parcelamento";

type ListaParcelamentosProps = {
  parcelamentos: Parcelamento[];
  carregando?: boolean;
  processandoId?: number | null;
  onEditar?: (parcelamento: Parcelamento) => void;
  onVerParcelas?: (parcelamento: Parcelamento) => void;
  onCancelar: (parcelamento: Parcelamento) => void;
};

function formatarMoeda(valor: number | string) {
  const valorNumerico = Number(valor);

  if (!Number.isFinite(valorNumerico)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorNumerico);
}

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);

  if (!ano || !mes || !dia) {
    return data;
  }

  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(ano, mes - 1, dia)
  );
}

function obterIconeCategoria(categoria: string) {
  const categoriaNormalizada = categoria
    .trim()
    .toLocaleLowerCase("pt-BR");

  const icones: Record<string, string> = {
    alimentação: "🍽️",
    moradia: "🏠",
    transporte: "🚗",
    saúde: "❤️",
    educação: "📚",
    lazer: "🎮",
    eletrônicos: "💻",
    móveis: "🛋️",
    vestuário: "👕",
    cartão: "💳",
    viagem: "✈️",
    assinaturas: "🔁",
    compras: "🛍️",
    outros: "📌",
  };

  return icones[categoriaNormalizada] ?? "📌";
}

function obterConfiguracaoStatus(
  status: StatusParcelamento
) {
  const configuracoes = {
    ativo: {
      texto: "Ativo",
      classes:
        "border-emerald-900/70 bg-emerald-950/40 text-emerald-400",
    },
    concluido: {
      texto: "Concluído",
      classes:
        "border-blue-900/70 bg-blue-950/40 text-blue-400",
    },
    cancelado: {
      texto: "Cancelado",
      classes:
        "border-zinc-700 bg-zinc-900 text-zinc-400",
    },
  };

  return configuracoes[status];
}

function calcularProgresso(parcelamento: Parcelamento) {
  const hoje = new Date();

  const dataInicial = new Date(
    `${parcelamento.data_primeira_parcela}T12:00:00`
  );

  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();

  const anoInicial = dataInicial.getFullYear();
  const mesInicial = dataInicial.getMonth();

  const mesesDecorridos =
    (anoAtual - anoInicial) * 12 +
    (mesAtual - mesInicial);

  const parcelaAtual = Math.min(
    Math.max(mesesDecorridos + 1, 0),
    parcelamento.quantidade_parcelas
  );

  const percentual =
    parcelamento.quantidade_parcelas > 0
      ? Math.min(
          (parcelaAtual /
            parcelamento.quantidade_parcelas) *
            100,
          100
        )
      : 0;

  return {
    parcelaAtual,
    percentual,
    restantes: Math.max(
      parcelamento.quantidade_parcelas -
        parcelaAtual,
      0
    ),
  };
}

function EstadoCarregando() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map(
        (_, indice) => (
          <div
            key={indice}
            className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-800" />

              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-zinc-800" />
                <div className="mt-3 h-3 w-28 rounded bg-zinc-900" />
                <div className="mt-5 h-2 w-full rounded bg-zinc-900" />
              </div>

              <div className="h-5 w-24 rounded bg-zinc-800" />
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-2xl">
        ▦
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        Nenhum parcelamento encontrado
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Cadastre sua primeira compra parcelada ou
        altere os filtros utilizados.
      </p>
    </div>
  );
}

export default function ListaParcelamentos({
  parcelamentos,
  carregando = false,
  processandoId = null,
  onEditar,
  onVerParcelas,
  onCancelar,
}: ListaParcelamentosProps) {
  if (carregando) {
    return <EstadoCarregando />;
  }

  if (parcelamentos.length === 0) {
    return <EstadoVazio />;
  }

  return (
    <div className="space-y-4">
      {parcelamentos.map((parcelamento) => {
        const status =
          obterStatusParcelamento(parcelamento);

        const configuracaoStatus =
          obterConfiguracaoStatus(status);

        const progresso =
          calcularProgresso(parcelamento);

        const processando =
          processandoId === parcelamento.id;

        const dataFinal = adicionarMesesNaData(
          parcelamento.data_primeira_parcela,
          parcelamento.quantidade_parcelas - 1
        );

        return (
          <article
            key={parcelamento.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg shadow-black/20 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
                  {obterIconeCategoria(
                    parcelamento.categoria
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate text-lg font-bold text-white">
                      {parcelamento.descricao}
                    </h3>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${configuracaoStatus.classes}`}
                    >
                      {configuracaoStatus.texto}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {parcelamento.categoria}
                  </p>

                  {parcelamento.observacao && (
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-zinc-500">
                      {parcelamento.observacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left lg:text-right">
                <p className="text-sm text-zinc-500">
                  Valor total
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {formatarMoeda(
                    parcelamento.valor_total
                  )}
                </p>

                <p className="mt-1 text-sm font-semibold text-red-400">
                  {
                    parcelamento.quantidade_parcelas
                  }
                  x de{" "}
                  {formatarMoeda(
                    parcelamento.valor_parcela
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Primeira parcela
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarData(
                    parcelamento.data_primeira_parcela
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Última parcela
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarData(dataFinal)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Parcelas restantes
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {status === "cancelado"
                    ? "Cancelado"
                    : progresso.restantes}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4 text-sm">
                <p className="font-medium text-zinc-400">
                  Progresso
                </p>

                <p className="text-zinc-500">
                  {progresso.parcelaAtual}/
                  {
                    parcelamento.quantidade_parcelas
                  }{" "}
                  parcelas
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    status === "cancelado"
                      ? "bg-zinc-600"
                      : status === "concluido"
                        ? "bg-blue-500"
                        : "bg-red-600"
                  }`}
                  style={{
                    width: `${progresso.percentual}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-end">
              {onVerParcelas && (
                <button
                  type="button"
                  onClick={() =>
                    onVerParcelas(parcelamento)
                  }
                  disabled={processando}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ver parcelas
                </button>
              )}

              {onEditar &&
                status === "ativo" && (
                  <button
                    type="button"
                    onClick={() =>
                      onEditar(parcelamento)
                    }
                    disabled={processando}
                    className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Editar
                  </button>
                )}

              {status === "ativo" && (
                <button
                  type="button"
                  onClick={() =>
                    onCancelar(parcelamento)
                  }
                  disabled={processando}
                  className="rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processando
                    ? "Cancelando..."
                    : "Cancelar parcelamento"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}