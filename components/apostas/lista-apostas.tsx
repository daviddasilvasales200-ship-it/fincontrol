"use client";

import type {
  Aposta,
  ResultadoAposta,
} from "@/types/aposta";

type ListaApostasProps = {
  apostas: Aposta[];
  carregando?: boolean;
  processandoId?: number | null;
  onEditar: (aposta: Aposta) => void;
  onExcluir: (aposta: Aposta) => void;
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

function formatarOdd(
  valor: number | string
) {
  const valorNumerico = Number(valor);

  if (!Number.isFinite(valorNumerico)) {
    return "0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
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

function obterIconeModalidade(
  modalidade: string
) {
  const modalidadeNormalizada =
    modalidade
      .trim()
      .toLocaleLowerCase("pt-BR");

  const icones: Record<string, string> = {
    futebol: "⚽",
    basquete: "🏀",
    tênis: "🎾",
    vôlei: "🏐",
    mma: "🥊",
    "fórmula 1": "🏎️",
    esports: "🎮",
    hipismo: "🏇",
    beisebol: "⚾",
    hóquei: "🏒",
    outros: "◆",
  };

  return (
    icones[modalidadeNormalizada] ??
    "◆"
  );
}

function obterConfiguracaoResultado(
  resultado: ResultadoAposta
) {
  const configuracoes = {
    pendente: {
      texto: "Pendente",
      classes:
        "border-amber-900/70 bg-amber-950/40 text-amber-400",
      textoResultado: "text-amber-400",
    },
    ganha: {
      texto: "Ganha",
      classes:
        "border-emerald-900/70 bg-emerald-950/40 text-emerald-400",
      textoResultado: "text-emerald-400",
    },
    perdida: {
      texto: "Perdida",
      classes:
        "border-red-900/70 bg-red-950/40 text-red-400",
      textoResultado: "text-red-400",
    },
    anulada: {
      texto: "Anulada",
      classes:
        "border-zinc-700 bg-zinc-900 text-zinc-400",
      textoResultado: "text-zinc-300",
    },
  };

  return configuracoes[resultado];
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
                <div className="h-4 w-48 rounded bg-zinc-800" />

                <div className="mt-3 h-3 w-32 rounded bg-zinc-900" />

                <div className="mt-5 h-16 w-full rounded bg-zinc-900" />
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
        ⚽
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        Nenhuma aposta encontrada
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Cadastre uma nova aposta ou altere os
        filtros utilizados.
      </p>
    </div>
  );
}

function Confronto({
  timeCasa,
  timeVisitante,
}: {
  timeCasa: string | null;
  timeVisitante: string | null;
}) {
  if (!timeCasa && !timeVisitante) {
    return (
      <p className="text-sm text-zinc-600">
        Confronto não informado
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Primeiro time
        </p>

        <p className="mt-2 break-words font-bold text-white">
          {timeCasa || "Não informado"}
        </p>
      </div>

      <span className="self-center text-sm font-bold text-red-500">
        X
      </span>

      <div className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
          Segundo time
        </p>

        <p className="mt-2 break-words font-bold text-white">
          {timeVisitante || "Não informado"}
        </p>
      </div>
    </div>
  );
}

export default function ListaApostas({
  apostas = [],
  carregando = false,
  processandoId = null,
  onEditar,
  onExcluir,
}: ListaApostasProps) {
  if (carregando) {
    return <EstadoCarregando />;
  }

  if (apostas.length === 0) {
    return <EstadoVazio />;
  }

  return (
    <div className="space-y-4">
      {apostas.map((aposta) => {
        const processando =
          processandoId === aposta.id;

        const configuracaoResultado =
          obterConfiguracaoResultado(
            aposta.resultado
          );

        const lucroPrejuizo = Number(
          aposta.lucro_prejuizo
        );

        return (
          <article
            key={aposta.id}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg shadow-black/20 transition hover:border-zinc-700"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
                  {obterIconeModalidade(
                    aposta.modalidade
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="break-words text-lg font-bold text-white">
                      {aposta.descricao}
                    </h3>

                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${configuracaoResultado.classes}`}
                    >
                      {
                        configuracaoResultado.texto
                      }
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {aposta.modalidade}
                    {aposta.competicao
                      ? ` • ${aposta.competicao}`
                      : ""}
                    {aposta.casa_aposta
                      ? ` • ${aposta.casa_aposta}`
                      : ""}
                  </p>

                  {aposta.observacao && (
                    <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-zinc-500">
                      {aposta.observacao}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left lg:text-right">
                <p className="text-sm text-zinc-500">
                  Lucro ou prejuízo
                </p>

                <p
                  className={`mt-1 text-xl font-bold ${
                    lucroPrejuizo > 0
                      ? "text-emerald-400"
                      : lucroPrejuizo < 0
                        ? "text-red-400"
                        : "text-zinc-300"
                  }`}
                >
                  {lucroPrejuizo > 0
                    ? "+"
                    : ""}
                  {formatarMoeda(
                    lucroPrejuizo
                  )}
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  Odd {formatarOdd(aposta.odd)}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                    Confronto
                  </p>

                  {aposta.competicao && (
                    <p className="mt-1 text-sm font-semibold text-red-400">
                      {aposta.competicao}
                    </p>
                  )}
                </div>

                <p className="text-sm text-zinc-500">
                  {formatarData(
                    aposta.data_aposta
                  )}
                </p>
              </div>

              <Confronto
                timeCasa={aposta.time_casa}
                timeVisitante={
                  aposta.time_visitante
                }
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Valor apostado
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarMoeda(
                    aposta.valor_apostado
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Odd
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarOdd(aposta.odd)}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Retorno potencial
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {formatarMoeda(
                    aposta.retorno_potencial
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Resultado
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${configuracaoResultado.textoResultado}`}
                >
                  {
                    configuracaoResultado.texto
                  }
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Casa de aposta
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-zinc-300">
                  {aposta.casa_aposta ||
                    "Não informada"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  onEditar(aposta)
                }
                disabled={processando}
                className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() =>
                  onExcluir(aposta)
                }
                disabled={processando}
                className="rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processando
                  ? "Excluindo..."
                  : "Excluir"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}