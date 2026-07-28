"use client";

import {
  calcularRentabilidadeInvestimento,
  calcularResultadoInvestimento,
} from "@/types/investimento";

import type {
  Investimento,
} from "@/types/investimento";

type ListaInvestimentosProps = {
  investimentos: Investimento[];
  carregando?: boolean;
  processandoId?: number | null;
  onEditar: (
    investimento: Investimento
  ) => void;
  onAlterarStatus: (
    investimento: Investimento
  ) => void;
  onExcluir: (
    investimento: Investimento
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

function formatarPercentual(valor: number) {
  const valorSeguro = Number.isFinite(valor)
    ? valor
    : 0;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorSeguro);
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

function obterIconeTipo(tipo: string) {
  const tipoNormalizado = tipo
    .trim()
    .toLocaleLowerCase("pt-BR");

  const icones: Record<string, string> = {
    poupança: "🏦",
    cdb: "📄",
    lci: "🏠",
    lca: "🌾",
    "tesouro direto": "🏛️",
    "fundo de investimento": "📊",
    ações: "📈",
    etf: "📉",
    fii: "🏢",
    criptomoedas: "₿",
    "previdência privada": "🛡️",
    "conta remunerada": "💰",
    outros: "💼",
  };

  return icones[tipoNormalizado] ?? "💼";
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
        📈
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        Nenhum investimento encontrado
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Cadastre sua primeira aplicação ou
        altere os filtros utilizados.
      </p>
    </div>
  );
}

export default function ListaInvestimentos({
  investimentos,
  carregando = false,
  processandoId = null,
  onEditar,
  onAlterarStatus,
  onExcluir,
}: ListaInvestimentosProps) {
  if (carregando) {
    return <EstadoCarregando />;
  }

  if (investimentos.length === 0) {
    return <EstadoVazio />;
  }

  return (
    <div className="space-y-4">
      {investimentos.map((investimento) => {
        const processando =
          processandoId === investimento.id;

        const resultado =
          calcularResultadoInvestimento(
            investimento
          );

        const rentabilidade =
          calcularRentabilidadeInvestimento(
            investimento
          );

        const resultadoPositivo =
          resultado > 0;

        const resultadoNegativo =
          resultado < 0;

        return (
          <article
            key={investimento.id}
            className={`rounded-2xl border bg-zinc-950 p-5 shadow-lg shadow-black/20 transition ${
              investimento.ativo
                ? "border-zinc-800 hover:border-zinc-700"
                : "border-zinc-900 opacity-75"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
                  {obterIconeTipo(
                    investimento.tipo
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate text-lg font-bold text-white">
                      {investimento.nome}
                    </h3>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                        investimento.ativo
                          ? "border-emerald-900/70 bg-emerald-950/40 text-emerald-400"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {investimento.ativo
                        ? "Ativo"
                        : "Encerrado"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {investimento.tipo}
                    {investimento.instituicao
                      ? ` • ${investimento.instituicao}`
                      : ""}
                  </p>

                  {investimento.observacao && (
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-zinc-500">
                      {investimento.observacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left lg:text-right">
                <p className="text-sm text-zinc-500">
                  Valor atual
                </p>

                <p className="mt-1 text-xl font-bold text-white">
                  {formatarMoeda(
                    investimento.valor_atual
                  )}
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    resultadoPositivo
                      ? "text-emerald-400"
                      : resultadoNegativo
                        ? "text-red-400"
                        : "text-zinc-400"
                  }`}
                >
                  {resultadoPositivo ? "+" : ""}
                  {formatarMoeda(resultado)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Valor aplicado
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarMoeda(
                    investimento.valor_aplicado
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Resultado
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    resultadoPositivo
                      ? "text-emerald-400"
                      : resultadoNegativo
                        ? "text-red-400"
                        : "text-zinc-300"
                  }`}
                >
                  {resultadoPositivo ? "+" : ""}
                  {formatarMoeda(resultado)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Rentabilidade
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${
                    rentabilidade > 0
                      ? "text-emerald-400"
                      : rentabilidade < 0
                        ? "text-red-400"
                        : "text-zinc-300"
                  }`}
                >
                  {rentabilidade > 0 ? "+" : ""}
                  {formatarPercentual(
                    rentabilidade
                  )}
                  %
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Data da aplicação
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarData(
                    investimento.data_aplicacao
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  onEditar(investimento)
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
                    investimento
                  )
                }
                disabled={processando}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  investimento.ativo
                    ? "border-amber-900/70 text-amber-500 hover:border-amber-600 hover:bg-amber-950/30 hover:text-amber-400"
                    : "border-emerald-900/70 text-emerald-500 hover:border-emerald-600 hover:bg-emerald-950/30 hover:text-emerald-400"
                }`}
              >
                {processando
                  ? "Processando..."
                  : investimento.ativo
                    ? "Encerrar"
                    : "Reativar"}
              </button>

              <button
                type="button"
                onClick={() =>
                  onExcluir(investimento)
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