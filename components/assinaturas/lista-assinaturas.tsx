"use client";

import {
  calcularDiasAteCobranca,
  calcularProximaCobranca,
  formatarDiaVencimento,
} from "@/types/assinatura";

import type {
  Assinatura,
} from "@/types/assinatura";

type ListaAssinaturasProps = {
  assinaturas: Assinatura[];
  carregando?: boolean;
  processandoId?: number | null;
  onEditar: (assinatura: Assinatura) => void;
  onAlterarStatus: (
    assinatura: Assinatura
  ) => void;
  onExcluir: (
    assinatura: Assinatura
  ) => void;
};

function formatarMoeda(
  valor: number | string
) {
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
  const [ano, mes, dia] = data
    .split("-")
    .map(Number);

  if (!ano || !mes || !dia) {
    return data;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(new Date(ano, mes - 1, dia));
}

function obterIconeCategoria(
  categoria: string
) {
  const categoriaNormalizada = categoria
    .trim()
    .toLocaleLowerCase("pt-BR");

  const icones: Record<string, string> = {
    streaming: "📺",
    música: "🎵",
    software: "💻",
    armazenamento: "☁️",
    telefonia: "📱",
    internet: "🌐",
    academia: "🏋️",
    educação: "📚",
    notícias: "📰",
    jogos: "🎮",
    saúde: "❤️",
    seguros: "🛡️",
    clube: "⭐",
    outros: "🔁",
  };

  return (
    icones[categoriaNormalizada] ??
    "🔁"
  );
}

function obterTextoProximaCobranca(
  assinatura: Assinatura
) {
  if (!assinatura.ativa) {
    return "Cobranças suspensas";
  }

  const proximaCobranca =
    calcularProximaCobranca(
      assinatura
    );

  const diasAteCobranca =
    calcularDiasAteCobranca(
      proximaCobranca
    );

  if (diasAteCobranca === 0) {
    return "Cobrança hoje";
  }

  if (diasAteCobranca === 1) {
    return "Cobrança amanhã";
  }

  return `Cobrança em ${diasAteCobranca} dias`;
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

                <div className="mt-5 h-3 w-52 rounded bg-zinc-900" />
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
        📺
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        Nenhuma assinatura encontrada
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Cadastre seu primeiro serviço recorrente
        ou altere os filtros utilizados.
      </p>
    </div>
  );
}

export default function ListaAssinaturas({
  assinaturas,
  carregando = false,
  processandoId = null,
  onEditar,
  onAlterarStatus,
  onExcluir,
}: ListaAssinaturasProps) {
  if (carregando) {
    return <EstadoCarregando />;
  }

  if (assinaturas.length === 0) {
    return <EstadoVazio />;
  }

  return (
    <div className="space-y-4">
      {assinaturas.map((assinatura) => {
        const processando =
          processandoId === assinatura.id;

        const proximaCobranca =
          calcularProximaCobranca(
            assinatura
          );

        const custoAnual =
          Number(assinatura.valor) * 12;

        return (
          <article
            key={assinatura.id}
            className={`rounded-2xl border bg-zinc-950 p-5 shadow-lg shadow-black/20 transition ${
              assinatura.ativa
                ? "border-zinc-800 hover:border-zinc-700"
                : "border-zinc-900 opacity-75"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
                  {obterIconeCategoria(
                    assinatura.categoria
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate text-lg font-bold text-white">
                      {assinatura.nome}
                    </h3>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        assinatura.ativa
                          ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-400"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {assinatura.ativa
                        ? "Ativa"
                        : "Inativa"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {assinatura.categoria}
                  </p>

                  {assinatura.observacao && (
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-zinc-500">
                      {assinatura.observacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left lg:text-right">
                <p className="text-sm text-zinc-500">
                  Custo mensal
                </p>

                <p className="mt-1 text-xl font-bold text-red-400">
                  {formatarMoeda(
                    assinatura.valor
                  )}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  {formatarMoeda(custoAnual)} ao ano
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Vencimento
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarDiaVencimento(
                    assinatura.dia_vencimento
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Próxima cobrança
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {assinatura.ativa
                    ? formatarData(
                        proximaCobranca
                      )
                    : "Sem cobrança"}
                </p>

                <p
                  className={`mt-1 text-xs ${
                    assinatura.ativa
                      ? "text-red-400"
                      : "text-zinc-600"
                  }`}
                >
                  {obterTextoProximaCobranca(
                    assinatura
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Início
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarData(
                    assinatura.data_inicio
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  onEditar(assinatura)
                }
                disabled={processando}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() =>
                  onAlterarStatus(
                    assinatura
                  )
                }
                disabled={processando}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  assinatura.ativa
                    ? "border-amber-900/70 text-amber-500 hover:border-amber-600 hover:bg-amber-950/30 hover:text-amber-400"
                    : "border-emerald-900/70 text-emerald-500 hover:border-emerald-600 hover:bg-emerald-950/30 hover:text-emerald-400"
                }`}
              >
                {processando
                  ? "Processando..."
                  : assinatura.ativa
                    ? "Desativar"
                    : "Reativar"}
              </button>

              <button
                type="button"
                onClick={() =>
                  onExcluir(assinatura)
                }
                disabled={processando}
                className="rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}