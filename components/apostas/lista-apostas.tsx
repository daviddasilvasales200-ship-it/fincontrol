"use client";

import { useState } from "react";

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
  onAtualizarResultado: (
    aposta: Aposta,
    resultado: ResultadoAposta
  ) => Promise<void> | void;
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

function resumirTexto(
  texto: string,
  limite = 150
) {
  const valor = texto.trim();

  if (valor.length <= limite) {
    return valor;
  }

  return `${valor.slice(0, limite).trim()}…`;
}

function EstadoCarregando() {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({ length: 4 }).map(
        (_, indice) => (
          <div
            key={indice}
            className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          >
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-800" />

              <div className="flex-1">
                <div className="h-4 w-40 rounded bg-zinc-800" />
                <div className="mt-3 h-3 w-28 rounded bg-zinc-900" />
                <div className="mt-4 h-16 rounded-xl bg-zinc-900" />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
        ⚽
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">
        Nenhuma aposta encontrada
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Cadastre uma nova aposta ou altere os
        filtros utilizados.
      </p>
    </div>
  );
}

function ConfrontoCompacto({
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
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3">
      <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold text-white">
        {timeCasa || "Não informado"}
      </p>

      <span className="shrink-0 text-xs font-bold text-red-500">
        X
      </span>

      <p className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-white">
        {timeVisitante || "Não informado"}
      </p>
    </div>
  );
}

export default function ListaApostas({
  apostas = [],
  carregando = false,
  processandoId = null,
  onEditar,
  onExcluir,
  onAtualizarResultado,
}: ListaApostasProps) {
  const [
    observacaoAbertaId,
    setObservacaoAbertaId,
  ] = useState<number | null>(null);

  if (carregando) {
    return <EstadoCarregando />;
  }

  if (apostas.length === 0) {
    return <EstadoVazio />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
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

        const observacaoAberta =
          observacaoAbertaId === aposta.id;

        const vindoDeDica =
          aposta.origem === "dica";

        return (
          <article
            key={aposta.id}
            className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-lg shadow-black/20 transition hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-lg">
                  {obterIconeModalidade(
                    aposta.modalidade
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-words text-base font-bold text-white sm:text-lg">
                      {aposta.descricao}
                    </h3>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${configuracaoResultado.classes}`}
                    >
                      {configuracaoResultado.texto}
                    </span>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        vindoDeDica
                          ? "border-blue-900/70 bg-blue-950/40 text-blue-400"
                          : "border-zinc-700 bg-zinc-900 text-zinc-400"
                      }`}
                    >
                      {vindoDeDica
                        ? "Dica"
                        : "Manual"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    {aposta.modalidade}
                    {aposta.competicao
                      ? ` • ${aposta.competicao}`
                      : ""}
                    {aposta.casa_aposta
                      ? ` • ${aposta.casa_aposta}`
                      : ""}
                  </p>

                  <p className="mt-1 text-xs text-zinc-600">
                    {formatarData(
                      aposta.data_aposta
                    )}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Lucro / prejuízo
                </p>

                <p
                  className={`mt-1 text-lg font-bold ${
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

                <p className="mt-1 text-xs text-zinc-500">
                  Odd{" "}
                  {formatarOdd(aposta.odd)}
                </p>
              </div>
            </div>

            {(aposta.time_casa ||
              aposta.time_visitante) && (
              <div className="mt-4">
                <ConfrontoCompacto
                  timeCasa={aposta.time_casa}
                  timeVisitante={
                    aposta.time_visitante
                  }
                />
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Apostado
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatarMoeda(
                    aposta.valor_apostado
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Odd
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatarOdd(aposta.odd)}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Retorno
                </p>

                <p className="mt-1 text-sm font-semibold text-white">
                  {formatarMoeda(
                    aposta.retorno_potencial
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Resultado
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${configuracaoResultado.textoResultado}`}
                >
                  {configuracaoResultado.texto}
                </p>
              </div>
            </div>

            {aposta.observacao && (
              <section className="mt-3 rounded-xl border border-zinc-800/80 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    Observação
                  </p>

                  {aposta.observacao.length >
                    150 && (
                    <button
                      type="button"
                      onClick={() =>
                        setObservacaoAbertaId(
                          observacaoAberta
                            ? null
                            : aposta.id
                        )
                      }
                      className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                    >
                      {observacaoAberta
                        ? "Mostrar menos"
                        : "Ver completa"}
                    </button>
                  )}
                </div>

                <p className="mt-2 break-words text-sm leading-6 text-zinc-400">
                  {observacaoAberta
                    ? aposta.observacao
                    : resumirTexto(
                        aposta.observacao
                      )}
                </p>
              </section>
            )}

            <div className="mt-auto pt-4">
              {aposta.resultado ===
                "pendente" && (
                <div className="mb-3 rounded-xl border border-zinc-800 bg-black/40 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-600">
                    Atualização rápida
                  </p>

                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void onAtualizarResultado(
                          aposta,
                          "ganha"
                        )
                      }
                      disabled={processando}
                      className="rounded-lg border border-emerald-900/70 bg-emerald-950/20 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:border-emerald-600 hover:bg-emerald-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Ganha
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void onAtualizarResultado(
                          aposta,
                          "perdida"
                        )
                      }
                      disabled={processando}
                      className="rounded-lg border border-red-900/70 bg-red-950/20 px-3 py-2 text-xs font-semibold text-red-400 transition hover:border-red-600 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Perdida
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void onAtualizarResultado(
                          aposta,
                          "anulada"
                        )
                      }
                      disabled={processando}
                      className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Anulada
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    onEditar(aposta)
                  }
                  disabled={processando}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onExcluir(aposta)
                  }
                  disabled={processando}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processando
                    ? "Excluindo..."
                    : "Excluir"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
