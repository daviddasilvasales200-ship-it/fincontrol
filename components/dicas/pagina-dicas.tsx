"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CardResumoDica from "@/components/dicas/card-resumo-dica";
import ListaDicas from "@/components/dicas/lista-dicas";
import { createClient } from "@/lib/supabase/client";

import {
  calcularResumoDicas,
} from "@/types/dica-aposta";

import type {
  DicaAposta,
  FiltroConfiancaDica,
  FiltroStatusDica,
} from "@/types/dica-aposta";

type RespostaAtualizacaoDicas = {
  sucesso?: boolean;
  erro?: string;
  mensagem?: string;

  partidasAnalisadas?: number;
  dicasSelecionadas?: number;
  dicasInseridas?: number;
  dicasAtualizadas?: number;
  oddsEncontradas?: number;
};

type RespostaExclusaoDica = {
  sucesso?: boolean;
  erro?: string;
  mensagem?: string;
};

type RespostaVerificacaoResultados = {
  sucesso?: boolean;
  erro?: string;
  mensagem?: string;

  dicasPendentes?: number;
  dicasVerificadas?: number;
  dicasGanhas?: number;
  dicasPerdidas?: number;
  dicasAnuladas?: number;
  dicasAindaPendentes?: number;
  dicasSemPartida?: number;
  dicasSemEstatistica?: number;
  errosAtualizacao?: number;
};

export default function PaginaDicas() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [dicas, setDicas] =
    useState<DicaAposta[]>([]);

  const [busca, setBusca] =
    useState("");

  const [competicao, setCompeticao] =
    useState("todas");

  const [confianca, setConfianca] =
    useState<FiltroConfiancaDica>(
      "todas"
    );

  const [status, setStatus] =
    useState<FiltroStatusDica>(
      "todos"
    );

  const [
    somenteDestaques,
    setSomenteDestaques,
  ] = useState(false);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizandoDicas,
    setAtualizandoDicas,
  ] = useState(false);

  const [
    verificandoResultados,
    setVerificandoResultados,
  ] = useState(false);

  const [
    processandoId,
    setProcessandoId,
  ] = useState<number | null>(null);

  const [erro, setErro] =
    useState("");

  const [
    mensagemAtualizacao,
    setMensagemAtualizacao,
  ] = useState("");

  const carregarDicas = useCallback(
    async (
      mostrarCarregamento = true
    ) => {
      if (mostrarCarregamento) {
        setCarregando(true);
      }

      setErro("");

      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } =
          await supabase.auth.getUser();

        if (usuarioError) {
          throw usuarioError;
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
          .from("dicas_apostas")
          .select(
            `
              id,
              user_id,
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
              destaque,
              publicada_em,
              atualizada_em,
              created_at
            `
          )
          .order("destaque", {
            ascending: false,
          })
          .order("data_jogo", {
            ascending: true,
          })
          .order("horario_jogo", {
            ascending: true,
            nullsFirst: false,
          })
          .order("publicada_em", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        const registros:
          DicaAposta[] = (
          data ?? []
        )
          .filter(
            (dica) =>
              Number(dica.odd) >
              1.01
          )
          .map((dica) => ({
            id:
              Number(dica.id),

            user_id:
              dica.user_id
                ? String(
                    dica.user_id
                  )
                : null,

            esporte:
              String(
                dica.esporte
              ),

            competicao:
              String(
                dica.competicao
              ),

            time_casa:
              String(
                dica.time_casa
              ),

            time_visitante:
              String(
                dica.time_visitante
              ),

            data_jogo:
              String(
                dica.data_jogo
              ),

            horario_jogo:
              dica.horario_jogo
                ? String(
                    dica.horario_jogo
                  )
                : null,

            mercado:
              String(
                dica.mercado
              ),

            entrada_sugerida:
              String(
                dica.entrada_sugerida
              ),

            odd:
              Number(
                dica.odd
              ),

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
                dica.lucro_prejuizo
              ),

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
          }));

        setDicas(registros);
      } catch (error) {
        console.error(
          "Erro ao carregar dicas:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as dicas."
        );

        setDicas([]);
      } finally {
        setCarregando(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void carregarDicas();
  }, [carregarDicas]);

  const competicoesDisponiveis =
    useMemo(() => {
      const nomes = dicas
        .map((dica) =>
          dica.competicao.trim()
        )
        .filter(Boolean);

      return Array.from(
        new Set(nomes)
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
      );
    }, [dicas]);

  const dicasFiltradas =
    useMemo(() => {
      const buscaNormalizada =
        busca
          .trim()
          .toLocaleLowerCase(
            "pt-BR"
          );

      return dicas.filter(
        (dica) => {
          const correspondeCompeticao =
            competicao ===
              "todas" ||
            dica.competicao ===
              competicao;

          const correspondeConfianca =
            confianca ===
              "todas" ||
            dica.nivel_confianca ===
              confianca;

          const correspondeStatus =
            status ===
              "todos" ||
            dica.status ===
              status;

          const correspondeDestaque =
            !somenteDestaques ||
            dica.destaque;

          if (
            !correspondeCompeticao ||
            !correspondeConfianca ||
            !correspondeStatus ||
            !correspondeDestaque
          ) {
            return false;
          }

          if (!buscaNormalizada) {
            return true;
          }

          const textoPesquisavel = [
            dica.esporte,
            dica.competicao,
            dica.time_casa,
            dica.time_visitante,
            dica.mercado,
            dica.entrada_sugerida,
            dica.justificativa ??
              "",
            dica.fonte_dados ??
              "",
          ]
            .join(" ")
            .toLocaleLowerCase(
              "pt-BR"
            );

          return textoPesquisavel.includes(
            buscaNormalizada
          );
        }
      );
    }, [
      dicas,
      busca,
      competicao,
      confianca,
      status,
      somenteDestaques,
    ]);

  const resumo = useMemo(
    () =>
      calcularResumoDicas(
        dicas
      ),
    [dicas]
  );

  const possuiFiltros =
    busca.trim() !== "" ||
    competicao !== "todas" ||
    confianca !== "todas" ||
    status !== "todos" ||
    somenteDestaques;

  const processandoAcao =
    atualizandoDicas ||
    verificandoResultados;

  function limparFiltros() {
    setBusca("");
    setCompeticao("todas");
    setConfianca("todas");
    setStatus("todos");
    setSomenteDestaques(
      false
    );
  }

  async function atualizarDicas() {
    setAtualizandoDicas(true);
    setErro("");
    setMensagemAtualizacao("");

    try {
      const resposta =
        await fetch(
          "/api/dicas/atualizar",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const tipoConteudo =
        resposta.headers.get(
          "content-type"
        );

      const textoResposta =
        await resposta.text();

      if (
        !tipoConteudo?.includes(
          "application/json"
        )
      ) {
        console.error(
          "Resposta inválida da atualização:",
          textoResposta
        );

        throw new Error(
          `A rota de atualização não retornou JSON. Status ${resposta.status}.`
        );
      }

      const resultado =
        JSON.parse(
          textoResposta
        ) as RespostaAtualizacaoDicas;

      if (!resposta.ok) {
        throw new Error(
          resultado.erro ??
            "Não foi possível atualizar as dicas."
        );
      }

      const inseridas =
        Number(
          resultado.dicasInseridas
        ) || 0;

      const atualizadas =
        Number(
          resultado.dicasAtualizadas
        ) || 0;

      const selecionadas =
        Number(
          resultado.dicasSelecionadas
        ) || 0;

      const analisadas =
        Number(
          resultado.partidasAnalisadas
        ) || 0;

      const oddsEncontradas =
        Number(
          resultado.oddsEncontradas
        ) || 0;

      const alteradas =
        inseridas +
        atualizadas;

      if (resultado.mensagem) {
        setMensagemAtualizacao(
          resultado.mensagem
        );
      } else if (
        alteradas > 0
      ) {
        setMensagemAtualizacao(
          `${inseridas} nova(s) dica(s) adicionada(s) e ${atualizadas} atualizada(s). ${oddsEncontradas} odd(s) real(is) encontrada(s).`
        );
      } else {
        setMensagemAtualizacao(
          `Nenhuma dica foi alterada. ${analisadas} partida(s) analisada(s), ${selecionadas} entrada(s) selecionada(s) e ${oddsEncontradas} odd(s) encontrada(s).`
        );
      }

      await carregarDicas(
        false
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar dicas:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar as dicas."
      );
    } finally {
      setAtualizandoDicas(
        false
      );
    }
  }

  async function verificarResultados() {
    setVerificandoResultados(
      true
    );

    setErro("");
    setMensagemAtualizacao("");

    try {
      /*
       * Esta chamada não contém
       * CRON_SECRET.
       *
       * A rota intermediária segura
       * verifica o usuário e chama
       * internamente o cron.
       */
      const resposta =
        await fetch(
          "/api/dicas/verificar-resultados",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const tipoConteudo =
        resposta.headers.get(
          "content-type"
        );

      const textoResposta =
        await resposta.text();

      if (
        !tipoConteudo?.includes(
          "application/json"
        )
      ) {
        console.error(
          "Resposta inválida da verificação:",
          textoResposta
        );

        throw new Error(
          `A rota de verificação não retornou JSON. Status ${resposta.status}.`
        );
      }

      const resultado =
        JSON.parse(
          textoResposta
        ) as RespostaVerificacaoResultados;

      if (!resposta.ok) {
        throw new Error(
          resultado.erro ??
            "Não foi possível verificar os resultados."
        );
      }

      const verificadas =
        Number(
          resultado.dicasVerificadas
        ) || 0;

      const ganhas =
        Number(
          resultado.dicasGanhas
        ) || 0;

      const perdidas =
        Number(
          resultado.dicasPerdidas
        ) || 0;

      const anuladas =
        Number(
          resultado.dicasAnuladas
        ) || 0;

      const aindaPendentes =
        Number(
          resultado.dicasAindaPendentes
        ) || 0;

      const semPartida =
        Number(
          resultado.dicasSemPartida
        ) || 0;

      const semEstatistica =
        Number(
          resultado.dicasSemEstatistica
        ) || 0;

      const errosAtualizacao =
        Number(
          resultado.errosAtualizacao
        ) || 0;

      if (resultado.mensagem) {
        setMensagemAtualizacao(
          resultado.mensagem
        );
      } else if (
        verificadas > 0
      ) {
        setMensagemAtualizacao(
          `${verificadas} dica(s) verificada(s): ${ganhas} ganha(s), ${perdidas} perdida(s) e ${anuladas} anulada(s).`
        );
      } else if (
        aindaPendentes > 0
      ) {
        setMensagemAtualizacao(
          `Nenhum resultado final disponível. ${aindaPendentes} dica(s) ainda está(ão) pendente(s).`
        );
      } else if (
        semPartida > 0 ||
        semEstatistica > 0
      ) {
        setMensagemAtualizacao(
          `Nenhuma dica foi concluída. ${semPartida} ficou(aram) sem partida localizada e ${semEstatistica} sem estatísticas completas.`
        );
      } else {
        setMensagemAtualizacao(
          "Não existem resultados pendentes para verificar."
        );
      }

      if (
        errosAtualizacao > 0
      ) {
        setErro(
          `${errosAtualizacao} resultado(s) não puderam ser salvo(s).`
        );
      }

      await carregarDicas(
        false
      );
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
      setVerificandoResultados(
        false
      );
    }
  }

  async function excluirDica(
    dica: DicaAposta
  ) {
    setProcessandoId(
      dica.id
    );

    setErro("");
    setMensagemAtualizacao("");

    try {
      const resposta =
        await fetch(
          `/api/dicas/${dica.id}`,
          {
            method: "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );

      const tipoConteudo =
        resposta.headers.get(
          "content-type"
        );

      const textoResposta =
        await resposta.text();

      if (
        !tipoConteudo?.includes(
          "application/json"
        )
      ) {
        console.error(
          "Resposta inválida da exclusão:",
          textoResposta
        );

        throw new Error(
          `A rota de exclusão não retornou JSON. Status ${resposta.status}.`
        );
      }

      const resultado =
        JSON.parse(
          textoResposta
        ) as RespostaExclusaoDica;

      if (!resposta.ok) {
        throw new Error(
          resultado.erro ??
            "Não foi possível excluir a dica."
        );
      }

      setDicas(
        (estadoAtual) =>
          estadoAtual.filter(
            (item) =>
              item.id !==
              dica.id
          )
      );

      setMensagemAtualizacao(
        resultado.mensagem ??
          "Dica excluída com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir dica:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a dica."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Dicas de entradas
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
              Consulte oportunidades
              baseadas em dados,
              probabilidades e análise
              estatística dos confrontos.
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
                processandoAcao
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

            <button
              type="button"
              onClick={() =>
                void atualizarDicas()
              }
              disabled={
                carregando ||
                processandoAcao
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className={
                  atualizandoDicas
                    ? "animate-spin"
                    : ""
                }
              >
                ↻
              </span>

              {atualizandoDicas
                ? "Buscando novas dicas..."
                : "Atualizar dicas"}
            </button>
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-amber-900/40 bg-amber-950/20 px-5 py-4 text-sm leading-6 text-amber-300/80">
          As dicas são baseadas em
          análise estatística e não
          garantem lucro ou acerto.
          Aposte com responsabilidade e
          utilize apenas valores que não
          comprometam seu orçamento.
        </div>

        {mensagemAtualizacao && (
          <div
            role="status"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-900/70 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300"
          >
            <p>
              {mensagemAtualizacao}
            </p>

            <button
              type="button"
              onClick={() =>
                setMensagemAtualizacao(
                  ""
                )
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
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-900/70 bg-red-950/40 px-5 py-4 text-sm text-red-300"
          >
            <p>{erro}</p>

            <button
              type="button"
              onClick={() =>
                setErro("")
              }
              aria-label="Fechar mensagem de erro"
              className="shrink-0 text-red-400 transition hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <CardResumoDica
            titulo="Total de dicas"
            quantidade={resumo.total}
            descricao="Todas as dicas publicadas"
            icone="◆"
            destaque="neutro"
          />

          <CardResumoDica
            titulo="Dicas ativas"
            quantidade={resumo.ativas}
            descricao="Entradas ainda disponíveis"
            icone="◉"
            destaque="atencao"
          />

          <CardResumoDica
            titulo="Alta confiança"
            quantidade={
              resumo.altaConfianca
            }
            descricao="Dicas classificadas como alta"
            icone="★"
            destaque="positivo"
          />

          <CardResumoDica
            titulo="Dicas ganhas"
            quantidade={resumo.ganhas}
            descricao="Resultados positivos registrados"
            icone="✓"
            destaque="positivo"
          />

          <CardResumoDica
            titulo="Dicas perdidas"
            quantidade={resumo.perdidas}
            descricao="Resultados negativos registrados"
            icone="✕"
            destaque="negativo"
          />

          <CardResumoDica
            titulo="Taxa de acerto"
            percentual={resumo.taxaAcerto}
            descricao="Considera ganhas e perdidas"
            icone="%"
            destaque={
              resumo.taxaAcerto >= 60
                ? "positivo"
                : resumo.taxaAcerto > 0
                  ? "atencao"
                  : "neutro"
            }
          />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="grid gap-4 xl:grid-cols-[1fr_250px_180px_180px_auto]">
            <div>
              <label
                htmlFor="busca-dica"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Buscar
              </label>

              <input
                id="busca-dica"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar por time, entrada ou mercado..."
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="competicao-dica"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Competição
              </label>

              <select
                id="competicao-dica"
                value={competicao}
                onChange={(event) =>
                  setCompeticao(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todas">
                  Todas as competições
                </option>

                {competicoesDisponiveis.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="confianca-dica"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Confiança
              </label>

              <select
                id="confianca-dica"
                value={confianca}
                onChange={(event) =>
                  setConfianca(
                    event.target
                      .value as FiltroConfiancaDica
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todas">
                  Todas
                </option>

                <option value="alta">
                  Alta
                </option>

                <option value="media">
                  Média
                </option>

                <option value="baixa">
                  Baixa
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="status-dica"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Status
              </label>

              <select
                id="status-dica"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as FiltroStatusDica
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todos">
                  Todos
                </option>

                <option value="ativa">
                  Ativas
                </option>

                <option value="encerrada">
                  Encerradas
                </option>

                <option value="cancelada">
                  Canceladas
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={limparFiltros}
                disabled={!possuiFiltros}
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto"
              >
                Limpar
              </button>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3">
            <input
              type="checkbox"
              checked={somenteDestaques}
              onChange={(event) =>
                setSomenteDestaques(
                  event.target.checked
                )
              }
              className="h-4 w-4 accent-red-600"
            />

            <span className="text-sm font-medium text-zinc-300">
              Mostrar somente dicas em
              destaque
            </span>
          </label>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Entradas disponíveis
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {dicasFiltradas.length}{" "}
                {dicasFiltradas.length ===
                1
                  ? "dica encontrada"
                  : "dicas encontradas"}
              </p>
            </div>

            <p className="text-xs text-zinc-600">
              Dados atualizados conforme a
              fonte informada em cada dica.
            </p>
          </div>

          <ListaDicas
            dicas={dicasFiltradas}
            carregando={carregando}
            processandoId={processandoId}
            onExcluir={excluirDica}
          />
        </section>
      </div>
    </main>
  );
}