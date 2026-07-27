"use client";

import type {
  Movimentacao,
  TipoMovimentacao,
} from "@/types/movimentacao";

type ListaMovimentacoesProps = {
  movimentacoes: Movimentacao[];
  tipo: TipoMovimentacao;
  carregando?: boolean;
  excluindoId?: number | null;
  onEditar: (movimentacao: Movimentacao) => void;
  onExcluir: (movimentacao: Movimentacao) => void;
};

function formatarMoeda(valor: number | string | null) {
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
    salário: "💼",
    "renda extra": "💰",
    freelance: "💻",
    investimentos: "📈",
    cashback: "💳",
    vendas: "🏷️",
    prêmios: "🏆",
    alimentação: "🍽️",
    moradia: "🏠",
    transporte: "🚗",
    saúde: "❤️",
    educação: "📚",
    lazer: "🎮",
    compras: "🛍️",
    assinaturas: "🔁",
    contas: "🧾",
    "cartão de crédito": "💳",
    apostas: "🎯",
    outros: "📌",
  };

  return icones[categoriaNormalizada] ?? "📌";
}

function EstadoVazio({
  tipo,
}: {
  tipo: TipoMovimentacao;
}) {
  const titulo =
    tipo === "receita"
      ? "Nenhuma receita encontrada"
      : "Nenhuma despesa encontrada";

  const descricao =
    tipo === "receita"
      ? "Cadastre sua primeira receita ou altere os filtros utilizados."
      : "Cadastre sua primeira despesa ou altere os filtros utilizados.";

  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-2xl">
        {tipo === "receita" ? "↗" : "↘"}
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        {titulo}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {descricao}
      </p>
    </div>
  );
}

function EstadoCarregando() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, indice) => (
        <div
          key={indice}
          className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-zinc-800" />

            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-zinc-800" />
              <div className="mt-3 h-3 w-28 rounded bg-zinc-900" />
            </div>

            <div className="h-5 w-24 rounded bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ListaMovimentacoes({
  movimentacoes,
  tipo,
  carregando = false,
  excluindoId = null,
  onEditar,
  onExcluir,
}: ListaMovimentacoesProps) {
  if (carregando) {
    return <EstadoCarregando />;
  }

  if (movimentacoes.length === 0) {
    return <EstadoVazio tipo={tipo} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/70 text-left">
              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Lançamento
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Categoria
              </th>

              <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Data
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Valor
              </th>

              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ações
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-800">
            {movimentacoes.map((movimentacao) => {
              const excluindo =
                excluindoId === movimentacao.id;

              return (
                <tr
                  key={movimentacao.id}
                  className="transition hover:bg-zinc-900/60"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-lg">
                        {obterIconeCategoria(
                          movimentacao.categoria
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {movimentacao.descricao}
                        </p>

                        {movimentacao.observacao && (
                          <p className="mt-1 max-w-xs truncate text-sm text-zinc-500">
                            {movimentacao.observacao}
                          </p>
                        )}

                        {movimentacao.numero_parcela &&
                          movimentacao.total_parcelas && (
                            <p className="mt-1 text-xs text-zinc-600">
                              Parcela{" "}
                              {movimentacao.numero_parcela}/
                              {movimentacao.total_parcelas}
                            </p>
                          )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
                      {movimentacao.categoria}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-zinc-400">
                    {formatarData(movimentacao.data)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span
                      className={`font-bold ${
                        tipo === "receita"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {tipo === "receita" ? "+" : "-"}{" "}
                      {formatarMoeda(movimentacao.valor)}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          onEditar(movimentacao)
                        }
                        disabled={excluindo}
                        aria-label={`Editar ${movimentacao.descricao}`}
                        title="Editar"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-sm text-zinc-400 transition hover:border-zinc-500 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onExcluir(movimentacao)
                        }
                        disabled={excluindo}
                        aria-label={`Excluir ${movimentacao.descricao}`}
                        title="Excluir"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-900/70 text-sm text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {excluindo ? "…" : "✕"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-zinc-800 md:hidden">
        {movimentacoes.map((movimentacao) => {
          const excluindo =
            excluindoId === movimentacao.id;

          return (
            <article
              key={movimentacao.id}
              className="p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-lg">
                  {obterIconeCategoria(
                    movimentacao.categoria
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {movimentacao.descricao}
                      </h3>

                      <p className="mt-1 text-xs text-zinc-500">
                        {formatarData(movimentacao.data)}
                      </p>
                    </div>

                    <p
                      className={`shrink-0 text-sm font-bold ${
                        tipo === "receita"
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {tipo === "receita" ? "+" : "-"}{" "}
                      {formatarMoeda(movimentacao.valor)}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
                      {movimentacao.categoria}
                    </span>

                    {movimentacao.numero_parcela &&
                      movimentacao.total_parcelas && (
                        <span className="inline-flex rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-500">
                          Parcela{" "}
                          {movimentacao.numero_parcela}/
                          {movimentacao.total_parcelas}
                        </span>
                      )}
                  </div>

                  {movimentacao.observacao && (
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">
                      {movimentacao.observacao}
                    </p>
                  )}

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditar(movimentacao)
                      }
                      disabled={excluindo}
                      className="flex-1 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        onExcluir(movimentacao)
                      }
                      disabled={excluindo}
                      className="flex-1 rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {excluindo
                        ? "Excluindo..."
                        : "Excluir"}
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}