"use client";

import Link from "next/link";
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

export type ApostaVinculadaDica = {
  id: number;
  dica_id: number;
  fixture_id: number | null;
  valor_apostado: number;
  odd: number;
  retorno_potencial: number;
  resultado: ResultadoDica;
  lucro_prejuizo: number;
  casa_aposta: string | null;
  created_at: string;
  updated_at: string;
};

type ListaDicasProps = {
  dicas: DicaAposta[];
  apostasPorDica?: Record<
    number,
    ApostaVinculadaDica
  >;
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

function formatarMoeda(
  valor: number
) {
  const valorSeguro =
    Number.isFinite(valor)
      ? valor
      : 0;

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
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

  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }
  ).format(valor)}%`;
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
    return "—";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      maximumFractionDigits: 0,
    }
  ).format(valor);
}

function formatarPublicacao(
  valor: string
) {
  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return valor;
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(data);
}

function resumirTexto(
  texto: string,
  limite = 220
) {
  const valor =
    texto.trim();

  if (
    valor.length <= limite
  ) {
    return valor;
  }

  return `${valor.slice(
    0,
    limite
  ).trim()}…`;
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
    <div className="grid gap-4 xl:grid-cols-2">
      {Array.from({
        length: 4,
      }).map((_, indice) => (
        <div
          key={indice}
          className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
        >
          <div className="flex justify-between gap-4">
            <div className="flex-1">
              <div className="h-4 w-40 rounded bg-zinc-800" />
              <div className="mt-3 h-7 w-64 rounded bg-zinc-800" />
              <div className="mt-4 h-16 rounded-xl bg-zinc-900" />
            </div>

            <div className="h-20 w-24 rounded-xl bg-zinc-900" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
        💡
      </div>

      <h3 className="mt-4 text-lg font-bold text-white">
        Nenhuma dica encontrada
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
        Ainda não existem dicas disponíveis para
        os filtros selecionados.
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

  return (
    <section
      className={`mt-4 rounded-xl border p-4 ${classes.painel}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-[0.15em] ${classes.titulo}`}
          >
            Resultado verificado
          </p>

          {verificadoEm && (
            <p className="mt-1 text-xs text-zinc-500">
              {verificadoEm}
            </p>
          )}
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${classes.selo}`}
        >
          {formatarResultadoDica(
            dica.resultado
          )}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        <div className="rounded-lg border border-zinc-800/80 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Placar
          </p>
          <p className="mt-1 font-bold text-white">
            {dica.placar_final ||
              "—"}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Gols
          </p>
          <p className="mt-1 font-bold text-white">
            {formatarQuantidade(
              dica.total_gols
            )}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Escanteios
          </p>
          <p className="mt-1 font-bold text-white">
            {formatarQuantidade(
              dica.total_escanteios
            )}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Cartões
          </p>
          <p className="mt-1 font-bold text-white">
            {formatarQuantidade(
              dica.total_cartoes
            )}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-black/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Resultado
          </p>
          <p
            className={`mt-1 font-bold ${classes.lucro}`}
          >
            {formatarLucroPrejuizoDica(
              dica.lucro_prejuizo
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

function PainelApostaVinculada({
  aposta,
}: {
  aposta: ApostaVinculadaDica;
}) {
  return (
    <section className="mt-4 rounded-xl border border-blue-900/60 bg-blue-950/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex rounded-full border border-blue-800/70 bg-blue-950/60 px-2.5 py-1 text-[11px] font-semibold text-blue-300">
            Aposta registrada
          </span>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="text-zinc-500">
              Valor{" "}
              <strong className="text-white">
                {formatarMoeda(
                  aposta.valor_apostado
                )}
              </strong>
            </span>

            <span className="text-zinc-500">
              Odd{" "}
              <strong className="text-white">
                {formatarOdd(
                  aposta.odd
                )}
              </strong>
            </span>

            <span className="text-zinc-500">
              Resultado{" "}
              <strong
                className={obterClassesResultado(
                  aposta.resultado
                )}
              >
                {formatarResultadoDica(
                  aposta.resultado
                )}
              </strong>
            </span>

            {aposta.resultado !==
              "pendente" && (
              <span className="text-zinc-500">
                Lucro{" "}
                <strong
                  className={
                    aposta.lucro_prejuizo >
                    0
                      ? "text-emerald-400"
                      : aposta.lucro_prejuizo <
                          0
                        ? "text-red-400"
                        : "text-zinc-300"
                  }
                >
                  {formatarMoeda(
                    aposta.lucro_prejuizo
                  )}
                </strong>
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/apostas?aposta=${aposta.id}`}
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-blue-800/70 bg-blue-950/40 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:border-blue-600 hover:bg-blue-900/40"
        >
          Ver aposta
        </Link>
      </div>
    </section>
  );
}

export default function ListaDicas({
  dicas,
  apostasPorDica = {},
  carregando = false,
  processandoId = null,
  onExcluir,
}: ListaDicasProps) {
  const [
    confirmandoId,
    setConfirmandoId,
  ] =
    useState<number | null>(
      null
    );

  const [
    analiseAbertaId,
    setAnaliseAbertaId,
  ] =
    useState<number | null>(
      null
    );

  if (carregando) {
    return <EstadoCarregando />;
  }

  if (dicas.length === 0) {
    return <EstadoVazio />;
  }

  async function confirmarExclusao(
    dica: DicaAposta
  ) {
    await onExcluir(dica);
    setConfirmandoId(null);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
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

        const analiseAberta =
          analiseAbertaId ===
          dica.id;

        const possuiResultadoDetalhado =
          dicaPossuiResultadoDetalhado(
            dica
          );

        const apostaVinculada =
          apostasPorDica[dica.id] ??
          null;

        return (
          <article
            key={dica.id}
            className={`flex flex-col rounded-2xl border bg-zinc-950 p-4 shadow-lg shadow-black/20 transition ${
              dica.destaque
                ? "border-red-800/80 hover:border-red-700"
                : "border-zinc-800 hover:border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {dica.destaque && (
                    <span className="rounded-full border border-red-900/70 bg-red-950/40 px-2.5 py-1 text-[11px] font-semibold text-red-400">
                      Destaque
                    </span>
                  )}

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${classesConfianca.selo}`}
                  >
                    {formatarNivelConfianca(
                      dica.nivel_confianca
                    )}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${obterClassesStatus(
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
                      className={`rounded-full border border-zinc-800 bg-black px-2.5 py-1 text-[11px] font-semibold ${obterClassesResultado(
                        dica.resultado
                      )}`}
                    >
                      {formatarResultadoDica(
                        dica.resultado
                      )}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-xs font-semibold text-red-400">
                  {dica.competicao}
                </p>

                <h3 className="mt-1 break-words text-lg font-bold text-white sm:text-xl">
                  {criarTextoConfronto(
                    dica
                  )}
                </h3>

                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
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
                    <span className="truncate">
                      {dica.fonte_dados}
                    </span>
                  )}
                </div>
              </div>

              <div className="w-24 shrink-0 rounded-xl border border-zinc-800 bg-black px-3 py-3 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Odd
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {formatarOdd(
                    dica.odd
                  )}
                </p>

                <p
                  className={`mt-1 text-xs font-semibold ${classesConfianca.texto}`}
                >
                  {formatarPercentual(
                    dica.probabilidade_estimada
                  )}
                </p>
              </div>
            </div>

            <section className="mt-4 rounded-xl border border-zinc-800 bg-black p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Entrada sugerida
                  </p>

                  <p className="mt-1 break-words text-base font-bold text-white sm:text-lg">
                    {dica.entrada_sugerida}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    {dica.mercado}
                  </p>
                </div>

                <div className="shrink-0 sm:w-36">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600">
                      Confiança
                    </span>

                    <strong
                      className={
                        classesConfianca.texto
                      }
                    >
                      {formatarPercentual(
                        dica.probabilidade_estimada
                      )}
                    </strong>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className={`h-full rounded-full ${classesConfianca.barra}`}
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
              </div>
            </section>

            {dica.justificativa && (
              <section className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950 p-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                    Análise
                  </p>

                  {dica.justificativa.length >
                    220 && (
                    <button
                      type="button"
                      onClick={() =>
                        setAnaliseAbertaId(
                          analiseAberta
                            ? null
                            : dica.id
                        )
                      }
                      className="text-xs font-semibold text-blue-400 transition hover:text-blue-300"
                    >
                      {analiseAberta
                        ? "Mostrar menos"
                        : "Ver completa"}
                    </button>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">
                  {analiseAberta
                    ? dica.justificativa
                    : resumirTexto(
                        dica.justificativa
                      )}
                </p>
              </section>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Mercado
                </p>

                <p className="mt-1 truncate text-xs font-semibold text-zinc-300">
                  {dica.mercado}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Resultado
                </p>

                <p
                  className={`mt-1 text-xs font-semibold ${obterClassesResultado(
                    dica.resultado
                  )}`}
                >
                  {formatarResultadoDica(
                    dica.resultado
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-black p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Publicada
                </p>

                <p className="mt-1 truncate text-xs font-semibold text-zinc-300">
                  {formatarPublicacao(
                    dica.publicada_em
                  )}
                </p>
              </div>
            </div>

            {possuiResultadoDetalhado && (
              <PainelResultadoDica
                dica={dica}
              />
            )}

            {apostaVinculada && (
              <PainelApostaVinculada
                aposta={
                  apostaVinculada
                }
              />
            )}

            <p className="mt-3 text-[11px] leading-5 text-amber-400/70">
              Análise estatística sem garantia de
              resultado.
            </p>

            <div className="mt-auto pt-4">
              {!confirmando ? (
                <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4 sm:flex-row sm:justify-end">
                  {!apostaVinculada &&
                    dica.resultado ===
                      "pendente" && (
                      <Link
                        href={`/apostas?dica=${dica.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-emerald-800/70 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-400 transition hover:border-emerald-600 hover:bg-emerald-950/50"
                      >
                        <span aria-hidden="true">
                          ＋
                        </span>
                        Usar como aposta
                      </Link>
                    )}

                  {apostaVinculada && (
                    <Link
                      href={`/apostas?aposta=${apostaVinculada.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-blue-800/70 bg-blue-950/30 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:border-blue-600 hover:bg-blue-950/50"
                    >
                      Ver aposta
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmandoId(
                        dica.id
                      )
                    }
                    disabled={processando}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-900/70 px-4 py-2 text-sm font-semibold text-red-500 transition hover:border-red-600 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Excluir
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-4">
                  <p className="text-sm font-semibold text-red-300">
                    Excluir esta dica?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-300/70">
                    Esta ação remove a dica permanentemente.
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmandoId(
                          null
                        )
                      }
                      disabled={processando}
                      className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
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
                      disabled={processando}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
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
