"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import CardResumoDica from "@/components/dicas/card-resumo-dica";
import TabelaDesempenhoDicas from "@/components/dicas/tabela-desempenho-dicas";

import { createClient } from "@/lib/supabase/client";

import {
  calcularHistoricoDicas,
  formatarPercentualHistorico,
  formatarUnidadesHistorico,
} from "@/types/historico-dicas";

import {
  criarTextoConfronto,
  formatarDataHoraDica,
  formatarResultadoDica,
} from "@/types/dica-aposta";

import type {
  DicaAposta,
} from "@/types/dica-aposta";

import type {
  PeriodoHistorico,
} from "@/types/historico-dicas";



type RespostaVerificacaoResultados = {
  sucesso?: boolean;
  erro?: string;
  mensagem?: string;
  dicasVerificadas?: number;
  dicasGanhas?: number;
  dicasPerdidas?: number;
  dicasAnuladas?: number;
  dicasAindaPendentes?: number;
  dicasSemPartida?: number;
  dicasSemEstatistica?: number;
  errosAtualizacao?: number;
};
function formatarDataJogo(
  valor: string
) {
  const [ano, mes, dia] =
    valor.split("-").map(Number);

  if (!ano || !mes || !dia) {
    return valor;
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
  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(valor)
      ? valor
      : 0
  );
}

function obterClasseResultado(
  resultado:
    DicaAposta["resultado"]
) {
  if (resultado === "ganha") {
    return "border-emerald-900/60 bg-emerald-950/30 text-emerald-400";
  }

  if (resultado === "perdida") {
    return "border-red-900/60 bg-red-950/30 text-red-400";
  }

  if (resultado === "anulada") {
    return "border-zinc-700 bg-zinc-900 text-zinc-300";
  }

  return "border-amber-900/60 bg-amber-950/30 text-amber-400";
}

function converterRegistro(
  dica: Record<string, unknown>
): DicaAposta {
  return {
    id:
      Number(dica.id),

    user_id:
      dica.user_id
        ? String(dica.user_id)
        : null,

    fixture_id:
      dica.fixture_id === null ||
      dica.fixture_id === undefined
        ? null
        : Number(
            dica.fixture_id
          ),

    esporte:
      String(dica.esporte),

    competicao:
      String(dica.competicao),

    time_casa:
      String(dica.time_casa),

    time_visitante:
      String(
        dica.time_visitante
      ),

    data_jogo:
      String(dica.data_jogo),

    horario_jogo:
      dica.horario_jogo
        ? String(
            dica.horario_jogo
          )
        : null,

    mercado:
      String(dica.mercado),

    entrada_sugerida:
      String(
        dica.entrada_sugerida
      ),

    odd:
      Number(dica.odd),

    probabilidade_estimada:
      dica.probabilidade_estimada ===
        null ||
      dica.probabilidade_estimada ===
        undefined
        ? null
        : Number(
            dica.probabilidade_estimada
          ),

    nivel_confianca:
      dica.nivel_confianca as DicaAposta["nivel_confianca"],

    justificativa:
      dica.justificativa
        ? String(
            dica.justificativa
          )
        : null,

    fonte_dados:
      dica.fonte_dados
        ? String(
            dica.fonte_dados
          )
        : null,

    status:
      dica.status as DicaAposta["status"],

    resultado:
      dica.resultado as DicaAposta["resultado"],

    lucro_prejuizo:
      Number(
        dica.lucro_prejuizo ??
          0
      ),

    placar_final:
      dica.placar_final
        ? String(
            dica.placar_final
          )
        : null,

    total_gols:
      dica.total_gols === null ||
      dica.total_gols === undefined
        ? null
        : Number(
            dica.total_gols
          ),

    total_escanteios:
      dica.total_escanteios ===
        null ||
      dica.total_escanteios ===
        undefined
        ? null
        : Number(
            dica.total_escanteios
          ),

    total_cartoes:
      dica.total_cartoes ===
        null ||
      dica.total_cartoes ===
        undefined
        ? null
        : Number(
            dica.total_cartoes
          ),

    resultado_verificado_em:
      dica.resultado_verificado_em
        ? String(
            dica.resultado_verificado_em
          )
        : null,

    destaque:
      Boolean(
        dica.destaque
      ),

    publicada_em:
      String(
        dica.publicada_em
      ),

    atualizada_em:
      String(
        dica.atualizada_em
      ),

    created_at:
      String(
        dica.created_at
      ),
  };
}

function EstadoCarregando() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 8,
        }).map((_, indice) => (
          <div
            key={indice}
            className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950"
          />
        ))}
      </div>

      <div className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950" />

      <div className="h-80 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950" />
    </div>
  );
}

export default function PaginaHistoricoDicas() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [
    dicas,
    setDicas,
  ] = useState<DicaAposta[]>(
    []
  );

  const [
    periodo,
    setPeriodo,
  ] = useState<PeriodoHistorico>(
    "todos"
  );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    erro,
    setErro,
  ] = useState("");

  const [
    verificandoResultados,
    setVerificandoResultados,
  ] = useState(false);

  const [
    mensagemVerificacao,
    setMensagemVerificacao,
  ] = useState("");

  const carregarHistorico =
    useCallback(async () => {
      setCarregando(true);
      setErro("");

      try {
        const {
          data: usuarioData,
          error: erroUsuario,
        } =
          await supabase.auth.getUser();

        if (erroUsuario) {
          throw erroUsuario;
        }

        if (!usuarioData.user) {
          throw new Error(
            "Sua sessão expirou. Entre novamente."
          );
        }

        const {
          data,
          error,
        } = await supabase
          .from(
            "dicas_apostas"
          )
          .select(
            `
              id,
              user_id,
              fixture_id,
              esporte,
              competicao,
              time_casa,
              time_visitante,
              data_jogo,
              horario_jogo,
              mercado,
              entrada_sugerida,
              odd,
              probabilidade_estimada,
              nivel_confianca,
              justificativa,
              fonte_dados,
              status,
              resultado,
              lucro_prejuizo,
              placar_final,
              total_gols,
              total_escanteios,
              total_cartoes,
              resultado_verificado_em,
              destaque,
              publicada_em,
              atualizada_em,
              created_at
            `
          )
          .order(
            "resultado_verificado_em",
            {
              ascending: false,
              nullsFirst: false,
            }
          )
          .order(
            "data_jogo",
            {
              ascending: false,
            }
          );

        if (error) {
          throw error;
        }

        const registros =
          (
            data ?? []
          ).map((dica) =>
            converterRegistro(
              dica as Record<
                string,
                unknown
              >
            )
          );

        setDicas(
          registros.filter(
            (dica) =>
              dica.resultado !== "pendente"
          )
        );
      } catch (error) {
        console.error(
          "Erro ao carregar histórico:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o histórico."
        );

        setDicas([]);
      } finally {
        setCarregando(false);
      }
    }, [supabase]);

  async function verificarResultados() {
    setVerificandoResultados(true);
    setErro("");
    setMensagemVerificacao("");

    try {
      const resposta = await fetch(
        "/api/dicas/verificar-resultados",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const resultado =
        (await resposta.json()) as RespostaVerificacaoResultados;

      if (!resposta.ok) {
        throw new Error(
          resultado.erro ??
            "Não foi possível verificar os resultados."
        );
      }

      const verificadas =
        Number(resultado.dicasVerificadas) || 0;
      const ganhas =
        Number(resultado.dicasGanhas) || 0;
      const perdidas =
        Number(resultado.dicasPerdidas) || 0;
      const anuladas =
        Number(resultado.dicasAnuladas) || 0;
      const pendentes =
        Number(resultado.dicasAindaPendentes) || 0;

      if (resultado.mensagem) {
        setMensagemVerificacao(
          resultado.mensagem
        );
      } else if (verificadas > 0) {
        setMensagemVerificacao(
          `${verificadas} entrada(s) verificada(s): ${ganhas} ganha(s), ${perdidas} perdida(s) e ${anuladas} anulada(s).`
        );
      } else if (pendentes > 0) {
        setMensagemVerificacao(
          `Nenhum resultado final disponível. ${pendentes} entrada(s) ainda está(ão) pendente(s).`
        );
      } else {
        setMensagemVerificacao(
          "Não existem entradas pendentes para verificar."
        );
      }

      await carregarHistorico();
    } catch (error) {
      console.error(
        "Erro ao verificar resultados:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar os resultados."
      );
    } finally {
      setVerificandoResultados(false);
    }
  }

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  const historico = useMemo(
    () =>
      calcularHistoricoDicas(
        dicas,
        periodo
      ),
    [
      dicas,
      periodo,
    ]
  );

  const dicasFinalizadas =
    useMemo(
      () =>
        historico.dicas.filter(
          (dica) =>
            dica.resultado !==
            "pendente"
        ),
      [historico.dicas]
    );

  const melhorMercado =
    historico.resumo
      .melhorMercado;

  const piorMercado =
    historico.resumo
      .piorMercado;

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Resultados das entradas
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
              Consulte as entradas finalizadas, verifique novos resultados e acompanhe o desempenho da estratégia.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() =>
                void verificarResultados()
              }
              disabled={
                carregando ||
                verificandoResultados
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-emerald-900/70 bg-emerald-950/30 px-5 py-3 text-sm font-semibold text-emerald-400 transition hover:border-emerald-700 hover:bg-emerald-950/50 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className={
                  verificandoResultados
                    ? "animate-spin"
                    : ""
                }
              >
                {verificandoResultados
                  ? "◌"
                  : "✓"}
              </span>

              {verificandoResultados
                ? "Verificando resultados..."
                : "Verificar resultados"}
            </button>

            <Link
              href="/dicas"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white"
            >
              Voltar para dicas
            </Link>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label
                htmlFor="periodo-historico"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Período analisado
              </label>

              <select
                id="periodo-historico"
                value={periodo}
                onChange={(event) =>
                  setPeriodo(
                    event.target
                      .value as PeriodoHistorico
                  )
                }
                className="min-w-56 rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todos">
                  Todo o histórico
                </option>

                <option value="7_dias">
                  Últimos 7 dias
                </option>

                <option value="30_dias">
                  Últimos 30 dias
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                void carregarHistorico()
              }
              disabled={carregando}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className={
                  carregando
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              Atualizar histórico
            </button>
          </div>
        </section>

        {mensagemVerificacao && (
          <div
            role="status"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-900/70 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300"
          >
            <p>{mensagemVerificacao}</p>

            <button
              type="button"
              onClick={() =>
                setMensagemVerificacao("")
              }
              aria-label="Fechar mensagem"
              className="shrink-0 text-emerald-400 transition hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-900/70 bg-red-950/40 px-5 py-4 text-sm text-red-300"
          >
            {erro}
          </div>
        )}

        {carregando ? (
          <div className="mt-8">
            <EstadoCarregando />
          </div>
        ) : (
          <>
            <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CardResumoDica
                titulo="Total analisado"
                quantidade={
                  historico.resumo.total
                }
                descricao="Todas as dicas do período"
                icone="◆"
              />

              <CardResumoDica
                titulo="Dicas ganhas"
                quantidade={
                  historico.resumo.ganhas
                }
                descricao="Resultados positivos"
                icone="✓"
                destaque="positivo"
              />

              <CardResumoDica
                titulo="Dicas perdidas"
                quantidade={
                  historico.resumo.perdidas
                }
                descricao="Resultados negativos"
                icone="✕"
                destaque="negativo"
              />

              <CardResumoDica
                titulo="Taxa de acerto"
                percentual={
                  historico.resumo
                    .taxaAcerto
                }
                descricao="Considera ganhas e perdidas"
                icone="%"
                destaque={
                  historico.resumo
                    .taxaAcerto >= 60
                    ? "positivo"
                    : historico.resumo
                          .taxaAcerto > 0
                      ? "atencao"
                      : "neutro"
                }
              />

              <CardResumoDica
                titulo="Lucro / prejuízo"
                unidades={
                  historico.resumo
                    .lucroPrejuizo
                }
                tipoValor="unidades"
                descricao="Resultado acumulado"
                icone="↕"
              />

              <CardResumoDica
                titulo="Odd média"
                quantidade={
                  historico.resumo
                    .oddMedia
                }
                descricao="Média das odds registradas"
                icone="×"
              />

              <CardResumoDica
                titulo="Probabilidade média"
                percentual={
                  historico.resumo
                    .probabilidadeMedia
                }
                descricao="Probabilidade estimada média"
                icone="≈"
              />

              <CardResumoDica
                titulo="Dicas anuladas"
                quantidade={
                  historico.resumo
                    .anuladas
                }
                descricao="Apostas devolvidas ou canceladas"
                icone="○"
              />
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-emerald-900/50 bg-emerald-950/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">
                  Melhor mercado
                </p>

                {melhorMercado ? (
                  <>
                    <h2 className="mt-3 text-xl font-bold text-white">
                      {melhorMercado.nome}
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <span className="text-emerald-400">
                        {formatarPercentualHistorico(
                          melhorMercado.taxaAcerto
                        )}{" "}
                        de acerto
                      </span>

                      <span className="text-zinc-400">
                        {formatarUnidadesHistorico(
                          melhorMercado
                            .lucroPrejuizo
                        )}
                      </span>

                      <span className="text-zinc-500">
                        {
                          melhorMercado.finalizadas
                        }{" "}
                        resultado(s)
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">
                    Ainda não existem resultados
                    suficientes.
                  </p>
                )}
              </article>

              <article className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                  Pior mercado
                </p>

                {piorMercado ? (
                  <>
                    <h2 className="mt-3 text-xl font-bold text-white">
                      {piorMercado.nome}
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-4 text-sm">
                      <span className="text-red-400">
                        {formatarPercentualHistorico(
                          piorMercado.taxaAcerto
                        )}{" "}
                        de acerto
                      </span>

                      <span className="text-zinc-400">
                        {formatarUnidadesHistorico(
                          piorMercado
                            .lucroPrejuizo
                        )}
                      </span>

                      <span className="text-zinc-500">
                        {
                          piorMercado.finalizadas
                        }{" "}
                        resultado(s)
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-zinc-500">
                    Ainda não existem resultados
                    suficientes.
                  </p>
                )}
              </article>
            </section>

            <div className="mt-8 grid gap-8">
              <TabelaDesempenhoDicas
                titulo="Desempenho por mercado"
                descricao="Compare a taxa de acerto e o retorno de cada tipo de entrada."
                itens={
                  historico.porMercado
                }
                vazioTexto="Nenhum mercado encontrado neste período."
              />

              <TabelaDesempenhoDicas
                titulo="Desempenho por competição"
                descricao="Resultados agrupados pelos campeonatos analisados."
                itens={
                  historico.porCompeticao
                }
                vazioTexto="Nenhuma competição encontrada neste período."
              />
            </div>

            <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
                <h2 className="text-lg font-bold text-white">
                  Resultados das entradas
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Entradas ganhas, perdidas ou anuladas no período selecionado.
                </p>
              </div>

              {dicasFinalizadas.length ===
              0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm text-zinc-500">
                    Nenhuma entrada finalizada
                    neste período.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900">
                  {dicasFinalizadas.map(
                    (dica) => {
                      const verificadoEm =
                        formatarDataHoraDica(
                          dica.resultado_verificado_em
                        );

                      return (
                        <article
                          key={dica.id}
                          className="p-5 transition hover:bg-zinc-900/30 sm:p-6"
                        >
                          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-3">
                                <span
                                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseResultado(
                                    dica.resultado
                                  )}`}
                                >
                                  {formatarResultadoDica(
                                    dica.resultado
                                  )}
                                </span>

                                <span className="text-sm font-semibold text-red-400">
                                  {dica.competicao}
                                </span>
                              </div>

                              <h3 className="mt-3 text-lg font-bold text-white">
                                {criarTextoConfronto(
                                  dica
                                )}
                              </h3>

                              <p className="mt-2 text-sm text-zinc-400">
                                {
                                  dica.entrada_sugerida
                                }
                              </p>

                              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-600">
                                <span>
                                  {formatarDataJogo(
                                    dica.data_jogo
                                  )}
                                </span>

                                <span>
                                  Mercado:{" "}
                                  {dica.mercado}
                                </span>

                                {verificadoEm && (
                                  <span>
                                    Verificado:{" "}
                                    {verificadoEm}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="grid min-w-72 grid-cols-3 gap-3">
                              <div className="rounded-xl border border-zinc-800 bg-black p-3 text-center">
                                <p className="text-xs text-zinc-600">
                                  Odd
                                </p>

                                <p className="mt-1 font-bold text-white">
                                  {formatarOdd(
                                    dica.odd
                                  )}
                                </p>
                              </div>

                              <div className="rounded-xl border border-zinc-800 bg-black p-3 text-center">
                                <p className="text-xs text-zinc-600">
                                  Placar
                                </p>

                                <p className="mt-1 font-bold text-white">
                                  {dica.placar_final ??
                                    "-"}
                                </p>
                              </div>

                              <div className="rounded-xl border border-zinc-800 bg-black p-3 text-center">
                                <p className="text-xs text-zinc-600">
                                  Resultado
                                </p>

                                <p
                                  className={`mt-1 font-bold ${
                                    dica.lucro_prejuizo >
                                    0
                                      ? "text-emerald-400"
                                      : dica.lucro_prejuizo <
                                          0
                                        ? "text-red-400"
                                        : "text-zinc-400"
                                  }`}
                                >
                                  {formatarUnidadesHistorico(
                                    dica.lucro_prejuizo
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}