"use client";

import { useState } from "react";

import {
  criarTextoConfronto,
  dicaPossuiResultadoDetalhado,
  formatarDataHoraDica,
  formatarLucroPrejuizoDica,
  formatarNivelConfianca,
  formatarResultadoDica,
  formatarStatusDica,
  normalizarHorarioDica,
} from "@/types/dica-aposta";

import type {
  DicaAposta,
  NivelConfiancaDica,
  ResultadoDica,
  StatusDica,
} from "@/types/dica-aposta";

type ListaDicasProps = {
  dicas: DicaAposta[];
  carregando?: boolean;
  processandoId?: number | null;

  onExcluir: (
    dica: DicaAposta
  ) => Promise<void> | void;
};

function formatarData(
  data: string
) {
  const [ano, mes, dia] =
    data.split("-").map(Number);

  if (!ano || !mes || !dia) {
    return data;
  }

  return new Intl.DateTimeFormat(
    "pt-BR"
  ).format(
    new Date(
      ano,
      mes - 1,
      dia
    )
  );
}

function formatarOdd(
  valor: number
) {
  const valorSeguro =
    Number.isFinite(valor)
      ? valor
      : 0;

  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(valorSeguro);
}

function formatarPercentual(
  valor: number | null
) {
  if (
    valor === null ||
    !Number.isFinite(valor)
  ) {
    return "Não informada";
  }

  const valorFormatado =
    new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }
    ).format(valor);

  return `${valorFormatado}%`;
}

function formatarQuantidade(
  valor:
    | number
    | null
    | undefined
) {
  if (
    valor === null ||
    valor === undefined ||
    !Number.isFinite(valor)
  ) {
    return "Não informada";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    }
  ).format(valor);
}

function obterClassesConfianca(
  nivel: NivelConfiancaDica
) {
  if (nivel === "alta") {
    return {
      selo:
        "border-emerald-900/70 bg-emerald-950/40 text-emerald-400",

      barra:
        "bg-emerald-500",

      texto:
        "text-emerald-400",
    };
  }

  if (nivel === "media") {
    return {
      selo:
        "border-amber-900/70 bg-amber-950/40 text-amber-400",

      barra:
        "bg-amber-500",

      texto:
        "text-amber-400",
    };
  }

  return {
    selo:
      "border-zinc-700 bg-zinc-900 text-zinc-400",

    barra:
      "bg-zinc-500",

    texto:
      "text-zinc-400",
  };
}

function obterClassesStatus(
  status: StatusDica
) {
  if (status === "ativa") {
    return "border-blue-900/70 bg-blue-950/40 text-blue-400";
  }

  if (status === "encerrada") {
    return "border-zinc-700 bg-zinc-900 text-zinc-400";
  }

  return "border-red-900/70 bg-red-950/40 text-red-400";
}

function obterClassesResultado(
  resultado: ResultadoDica
) {
  if (resultado === "ganha") {
    return "text-emerald-400";
  }

  if (resultado === "perdida") {
    return "text-red-400";
  }

  if (resultado === "anulada") {
    return "text-zinc-300";
  }

  return "text-amber-400";
}

function obterClassesPainelResultado(
  resultado: ResultadoDica
) {
  if (resultado === "ganha") {
    return {
      painel:
        "border-emerald-900/60 bg-emerald-950/20",

      titulo:
        "text-emerald-400",

      selo:
        "border-emerald-900/70 bg-emerald-950/50 text-emerald-300",

      lucro:
        "text-emerald-400",
    };
  }

  if (resultado === "perdida") {
    return {
      painel:
        "border-red-900/60 bg-red-950/20",

      titulo:
        "text-red-400",

      selo:
        "border-red-900/70 bg-red-950/50 text-red-300",

      lucro:
        "text-red-400",
    };
  }

  if (resultado === "anulada") {
    return {
      painel:
        "border-zinc-700 bg-zinc-900/50",

      titulo:
        "text-zinc-300",

      selo:
        "border-zinc-700 bg-zinc-900 text-zinc-300",

      lucro:
        "text-zinc-300",
    };
  }

  return {
    painel:
      "border-amber-900/50 bg-amber-950/20",

    titulo:
      "text-amber-400",

    selo:
      "border-amber-900/70 bg-amber-950/50 text-amber-300",

    lucro:
      "text-amber-400",
  };
}

function EstadoCarregando() {
  return (
    <div className="space-y-4">
      {Array.from({
        length: 4,
      }).map((_, indice) => (
        <div
          key={indice}
          className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-4 w-56 rounded bg-zinc-800" />

              <div className="mt-3 h-3 w-40 rounded bg-zinc-900" />

              <div className="mt-6 h-20 rounded-xl bg-zinc-900" />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="h-16 rounded-xl bg-zinc-900" />
                <div className="h-16 rounded-xl bg-zinc-900" />
                <div className="h-16 rounded-xl bg-zinc-900" />
              </div>
            </div>

            <div className="h-7 w-24 rounded-full bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-2xl">
        💡
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        Nenhuma dica encontrada
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Ainda não existem dicas disponíveis
        para os filtros selecionados.
      </p>
    </div>
  );
}

function PainelResultadoDica({
  dica,
}: {
  dica: DicaAposta;
}) {
  const classes =
    obterClassesPainelResultado(
      dica.resultado
    );

  const verificadoEm =
    formatarDataHoraDica(
      dica.resultado_verificado_em
    );

  const possuiEscanteios =
    dica.total_escanteios !==
      null &&
    dica.total_escanteios !==
      undefined;

  const possuiCartoes =
    dica.total_cartoes !==
      null &&
    dica.total_cartoes !==
      undefined;

  const possuiGols =
    dica.total_gols !==
      null &&
    dica.total_gols !==
      undefined;

  const possuiPlacar =
    Boolean(
      dica.placar_final
    );

  return (
    <section
      className={`mt-5 rounded-2xl border p-5 ${classes.painel}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.16em] ${classes.titulo}`}
          >
            Resultado verificado
          </p>

          <p className="mt-2 text-sm text-zinc-400">
            Dados oficiais da partida utilizados
            para encerrar esta dica.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-bold ${classes.selo}`}
        >
          {formatarResultadoDica(
            dica.resultado
          )}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Placar final
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {possuiPlacar
              ? dica.placar_final
              : "Não informado"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Gols
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {possuiGols
              ? formatarQuantidade(
                  dica.total_gols
                )
              : "Não informado"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Escanteios
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {possuiEscanteios
              ? formatarQuantidade(
                  dica.total_escanteios
                )
              : "Não informado"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Cartões
          </p>

          <p className="mt-2 text-lg font-bold text-white">
            {possuiCartoes
              ? formatarQuantidade(
                  dica.total_cartoes
                )
              : "Não informado"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-black/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Lucro / prejuízo
          </p>

          <p
            className={`mt-2 text-lg font-bold ${classes.lucro}`}
          >
            {formatarLucroPrejuizoDica(
              dica.lucro_prejuizo
            )}
          </p>
        </div>
      </div>

      {verificadoEm && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span>
            Verificado em:
          </span>

          <span className="font-semibold text-zinc-300">
            {verificadoEm}
          </span>
        </div>
      )}
    </section>
  );
}

export default function ListaDicas({
  dicas,
  carregando = false,
  processandoId = null,
  onExcluir,
}: ListaDicasProps) {
  const [
    confirmandoId,
    setConfirmandoId,
  ] = useState<number | null>(
    null
  );

  if (carregando) {
    return <EstadoCarregando />;
  }

  if (dicas.length === 0) {
    return <EstadoVazio />;
  }

  function solicitarExclusao(
    dica: DicaAposta
  ) {
    setConfirmandoId(
      dica.id
    );
  }

  async function confirmarExclusao(
    dica: DicaAposta
  ) {
    await onExcluir(dica);
    setConfirmandoId(null);
  }

  function cancelarExclusao() {
    setConfirmandoId(null);
  }

  return (
    <div className="space-y-4">
      {dicas.map((dica) => {
        const classesConfianca =
          obterClassesConfianca(
            dica.nivel_confianca
          );

        const horario =
          normalizarHorarioDica(
            dica.horario_jogo
          );

        const probabilidade =
          dica.probabilidade_estimada ??
          0;

        const processando =
          processandoId ===
          dica.id;

        const confirmando =
          confirmandoId ===
          dica.id;

        const possuiResultadoDetalhado =
          dicaPossuiResultadoDetalhado(
            dica
          );

        return (
          <article
            key={dica.id}
            className={`rounded-2xl border bg-zinc-950 p-5 shadow-lg shadow-black/20 transition ${
              dica.destaque
                ? "border-red-800/80 hover:border-red-700"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  {dica.destaque && (
                    <span className="inline-flex rounded-full border border-red-900/70 bg-red-950/40 px-3 py-1 text-xs font-semibold text-red-400">
                      Destaque
                    </span>
                  )}

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classesConfianca.selo}`}
                  >
                    Confiança{" "}
                    {formatarNivelConfianca(
                      dica.nivel_confianca
                    )}
                  </span>

                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${obterClassesStatus(
                      dica.status
                    )}`}
                  >
                    {formatarStatusDica(
                      dica.status
                    )}
                  </span>

                  {dica.resultado !==
                    "pendente" && (
                    <span
                      className={`inline-flex rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs font-semibold ${obterClassesResultado(
                        dica.resultado
                      )}`}
                    >
                      {formatarResultadoDica(
                        dica.resultado
                      )}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm font-semibold text-red-400">
                  {dica.competicao}
                </p>

                <h3 className="mt-2 break-words text-xl font-bold text-white sm:text-2xl">
                  {criarTextoConfronto(
                    dica
                  )}
                </h3>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-500">
                  <span>
                    {formatarData(
                      dica.data_jogo
                    )}
                  </span>

                  {horario && (
                    <span>
                      {horario}
                    </span>
                  )}

                  <span>
                    {dica.esporte}
                  </span>

                  {dica.fonte_dados && (
                    <span>
                      Fonte:{" "}
                      {dica.fonte_dados}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 rounded-2xl border border-zinc-800 bg-black px-5 py-4 xl:min-w-44 xl:text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Odd
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {formatarOdd(
                    dica.odd
                  )}
                </p>

                <p className="mt-2 text-xs text-zinc-600">
                  Probabilidade estimada
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${classesConfianca.texto}`}
                >
                  {formatarPercentual(
                    dica.probabilidade_estimada
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                Entrada sugerida
              </p>

              <p className="mt-3 text-xl font-bold text-white">
                {dica.entrada_sugerida}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Mercado: {dica.mercado}
              </p>
            </div>

            {possuiResultadoDetalhado && (
              <PainelResultadoDica
                dica={dica}
              />
            )}

            {dica.probabilidade_estimada !==
              null && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-zinc-500">
                    Nível estimado
                  </p>

                  <p
                    className={`text-sm font-semibold ${classesConfianca.texto}`}
                  >
                    {formatarPercentual(
                      dica.probabilidade_estimada
                    )}
                  </p>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className={`h-full rounded-full transition-all ${classesConfianca.barra}`}
                    style={{
                      width: `${Math.min(
                        Math.max(
                          probabilidade,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {dica.justificativa && (
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Análise
                </p>

                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-400">
                  {dica.justificativa}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Mercado
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {dica.mercado}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Confiança
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${classesConfianca.texto}`}
                >
                  {formatarNivelConfianca(
                    dica.nivel_confianca
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Resultado
                </p>

                <p
                  className={`mt-2 text-sm font-semibold ${obterClassesResultado(
                    dica.resultado
                  )}`}
                >
                  {formatarResultadoDica(
                    dica.resultado
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Publicada em
                </p>

                <p className="mt-2 text-sm font-semibold text-zinc-300">
                  {new Intl.DateTimeFormat(
                    "pt-BR",
                    {
                      dateStyle:
                        "short",

                      timeStyle:
                        "short",

                      timeZone:
                        "America/Sao_Paulo",
                    }
                  ).format(
                    new Date(
                      dica.publicada_em
                    )
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-xs leading-5 text-amber-300/80">
              Esta dica é baseada em análise
              estatística e não representa
              garantia de resultado.
            </div>

            <div className="mt-6 border-t border-zinc-800 pt-5">
              {!confirmando ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      solicitarExclusao(
                        dica
                      )
                    }
                    disabled={
                      processando
                    }
                    className="rounded-xl border border-red-900/70 px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Excluir dica
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-red-900/60 bg-red-950/20 p-4">
                  <p className="text-sm font-semibold text-red-300">
                    Excluir esta dica?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-300/70">
                    A dica de{" "}
                    <strong>
                      {criarTextoConfronto(
                        dica
                      )}
                    </strong>{" "}
                    será removida
                    permanentemente.
                  </p>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={
                        cancelarExclusao
                      }
                      disabled={
                        processando
                      }
                      className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        void confirmarExclusao(
                          dica
                        )
                      }
                      disabled={
                        processando
                      }
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {processando
                        ? "Excluindo..."
                        : "Confirmar exclusão"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}