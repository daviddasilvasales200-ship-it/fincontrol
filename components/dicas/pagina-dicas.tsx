"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import CardCotaApi, {
  type DadosCotaApi,
} from "@/components/dicas/card-cota-api";

import CardResumoDica from "@/components/dicas/card-resumo-dica";
import GraficosDicas from "@/components/dicas/graficos-dicas";
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
  consultasOdds?: number;
  mercadosEncontrados?: number;
};

type RespostaExclusaoDica = {
  sucesso?: boolean;
  erro?: string;
  mensagem?: string;
};


type RespostaErroApi = {
  sucesso?: boolean;
  erro?: string;
};

function formatarDataCurta(
  valor: string
) {
  const data =
    new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone:
        "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
    }
  ).format(data);
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

function formatarUnidades(
  valor: number
) {
  const numero =
    Number.isFinite(valor)
      ? valor
      : 0;

  const texto =
    new Intl.NumberFormat(
      "pt-BR",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(
      Math.abs(numero)
    );

  if (numero > 0) {
    return `+${texto} un`;
  }

  if (numero < 0) {
    return `-${texto} un`;
  }

  return "0,00 un";
}

function obterClasseResultado(
  resultado:
    DicaAposta["resultado"]
) {
  if (resultado === "ganha") {
    return "border-emerald-900/70 bg-emerald-950/40 text-emerald-400";
  }

  if (resultado === "perdida") {
    return "border-red-900/70 bg-red-950/40 text-red-400";
  }

  return "border-zinc-700 bg-zinc-900 text-zinc-300";
}

function obterTextoResultado(
  resultado:
    DicaAposta["resultado"]
) {
  if (resultado === "ganha") {
    return "Ganha";
  }

  if (resultado === "perdida") {
    return "Perdida";
  }

  if (resultado === "anulada") {
    return "Anulada";
  }

  return "Pendente";
}

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
    processandoId,
    setProcessandoId,
  ] = useState<number | null>(null);

  const [
    cotaApi,
    setCotaApi,
  ] = useState<DadosCotaApi | null>(
    null
  );

  const [
    carregandoCota,
    setCarregandoCota,
  ] = useState(true);

  const [
    erroCota,
    setErroCota,
  ] = useState("");

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

            fixture_id:
              dica.fixture_id ===
                null ||
              dica.fixture_id ===
                undefined
                ? null
                : Number(
                    dica.fixture_id
                  ),

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
              dica.total_gols ===
                null ||
              dica.total_gols ===
                undefined
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

  const carregarCota = useCallback(
    async (
      mostrarCarregamento = true
    ) => {
      if (mostrarCarregamento) {
        setCarregandoCota(true);
      }

      setErroCota("");

      try {
        const resposta =
          await fetch(
            "/api/dicas/cota-api",
            {
              method: "GET",

              headers: {
                "Content-Type":
                  "application/json",
              },

              cache: "no-store",
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
            "Resposta inválida da cota:",
            textoResposta
          );

          throw new Error(
            `A rota de cota não retornou JSON. Status ${resposta.status}.`
          );
        }

        const resultado =
          JSON.parse(
            textoResposta
          ) as
            | DadosCotaApi
            | RespostaErroApi;

        if (
          !resposta.ok ||
          !resultado.sucesso
        ) {
          const mensagemErro =
            "erro" in resultado &&
            typeof resultado.erro ===
              "string"
              ? resultado.erro
              : "Não foi possível consultar a cota da API.";

          throw new Error(
            mensagemErro
          );
        }

        setCotaApi(
          resultado as DadosCotaApi
        );
      } catch (error) {
        console.error(
          "Erro ao carregar cota:",
          error
        );

        setErroCota(
          error instanceof Error
            ? error.message
            : "Não foi possível consultar a cota da API."
        );
      } finally {
        setCarregandoCota(false);
      }
    },
    []
  );

  useEffect(() => {
    void carregarDicas();
    void carregarCota();
  }, [
    carregarDicas,
    carregarCota,
  ]);

  useEffect(() => {
    function atualizarAoVoltar() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void carregarDicas(false);
      }
    }

    window.addEventListener(
      "focus",
      atualizarAoVoltar
    );

    document.addEventListener(
      "visibilitychange",
      atualizarAoVoltar
    );

    return () => {
      window.removeEventListener(
        "focus",
        atualizarAoVoltar
      );

      document.removeEventListener(
        "visibilitychange",
        atualizarAoVoltar
      );
    };
  }, [carregarDicas]);

  const dicasPendentes =
    useMemo(
      () =>
        dicas.filter(
          (dica) =>
            dica.resultado ===
            "pendente"
        ),
      [dicas]
    );

  const resultadosFinalizados =
    useMemo(
      () =>
        dicas.filter(
          (dica) =>
            dica.resultado !==
            "pendente"
        ),
      [dicas]
    );

  const resultadosRecentes =
    useMemo(
      () =>
        [...resultadosFinalizados]
          .sort((a, b) => {
            const dataA =
              new Date(
                a.resultado_verificado_em ??
                  a.atualizada_em
              ).getTime();

            const dataB =
              new Date(
                b.resultado_verificado_em ??
                  b.atualizada_em
              ).getTime();

            return dataB - dataA;
          })
          .slice(0, 5),
      [resultadosFinalizados]
    );

  const competicoesDisponiveis =
    useMemo(() => {
      const nomes = dicasPendentes
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
    }, [dicasPendentes]);

  const dicasFiltradas =
    useMemo(() => {
      const buscaNormalizada =
        busca
          .trim()
          .toLocaleLowerCase(
            "pt-BR"
          );

      return dicasPendentes.filter(
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
      dicasPendentes,
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
    atualizandoDicas;

  const cotaEsgotada =
    cotaApi?.statusCota ===
      "esgotada" ||
    (
      cotaApi !== null &&
      cotaApi.limiteDiario > 0 &&
      cotaApi.restantesHoje <= 0
    );

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
    if (cotaEsgotada) {
      setErro(
        "A cota diária da API-Football está esgotada."
      );

      return;
    }

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
          resultado.oddsEncontradas ??
            resultado.consultasOdds
        ) || 0;

      const mercadosEncontrados =
        Number(
          resultado.mercadosEncontrados
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
          `${inseridas} nova(s) dica(s) adicionada(s) e ${atualizadas} atualizada(s). ${mercadosEncontrados} mercado(s) de odds encontrado(s).`
        );
      } else {
        setMensagemAtualizacao(
          `Nenhuma dica foi alterada. ${analisadas} partida(s) analisada(s), ${selecionadas} entrada(s) selecionada(s) e ${oddsEncontradas} consulta(s) de odds realizada(s).`
        );
      }

      await carregarDicas(false);
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

      await carregarCota(false);
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

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            <Link
              href="/historico-dicas"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-900/70 bg-blue-950/30 px-5 py-3 text-sm font-semibold text-blue-400 transition hover:border-blue-700 hover:bg-blue-950/50 hover:text-blue-300"
            >
              <span aria-hidden="true">
                ◫
              </span>

              Resultados das entradas
            </Link>

            <button
              type="button"
              onClick={() =>
                void atualizarDicas()
              }
              disabled={
                carregando ||
                processandoAcao ||
                cotaEsgotada
              }
              title={
                cotaEsgotada
                  ? "Cota diária esgotada"
                  : "Buscar novas dicas"
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
                : cotaEsgotada
                  ? "Cota esgotada"
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

        <div className="mt-8">
          <CardCotaApi
            dados={cotaApi}
            carregando={
              carregandoCota
            }
            erro={erroCota}
            onAtualizar={
              carregarCota
            }
          />
        </div>

        <div className="mt-8">
          <GraficosDicas
            dicas={dicas}
            carregando={carregando}
          />
        </div>

        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
          <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                Resultados recentes
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Últimas entradas verificadas no sistema.
              </p>
            </div>

            <Link
              href="/historico-dicas"
              className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Ver todos os resultados →
            </Link>
          </div>

          {resultadosRecentes.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-zinc-500">
              Nenhum resultado concluído até o momento.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-black/40 text-left">
                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Data
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Confronto
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Entrada
                      </th>

                      <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Resultado
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Odd
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                        Lucro
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {resultadosRecentes.map(
                      (dica) => (
                        <tr
                          key={dica.id}
                          className="border-b border-zinc-900 last:border-b-0"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-zinc-500">
                            {formatarDataCurta(
                              dica.resultado_verificado_em ??
                                dica.atualizada_em
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-zinc-200">
                              {dica.time_casa} x{" "}
                              {dica.time_visitante}
                            </p>

                            <p className="mt-1 text-xs text-zinc-600">
                              {dica.competicao}
                            </p>
                          </td>

                          <td className="max-w-xs px-5 py-4 text-sm text-zinc-400">
                            {dica.entrada_sugerida}
                          </td>

                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseResultado(
                                dica.resultado
                              )}`}
                            >
                              {obterTextoResultado(
                                dica.resultado
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-white">
                            {formatarOdd(
                              dica.odd
                            )}
                          </td>

                          <td
                            className={`whitespace-nowrap px-5 py-4 text-right font-bold ${
                              dica.lucro_prejuizo > 0
                                ? "text-emerald-400"
                                : dica.lucro_prejuizo < 0
                                  ? "text-red-400"
                                  : "text-zinc-400"
                            }`}
                          >
                            {formatarUnidades(
                              dica.lucro_prejuizo
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-zinc-900 md:hidden">
                {resultadosRecentes.map(
                  (dica) => (
                    <article
                      key={dica.id}
                      className="p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-white">
                            {dica.time_casa} x{" "}
                            {dica.time_visitante}
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {formatarDataCurta(
                              dica.resultado_verificado_em ??
                                dica.atualizada_em
                            )}{" "}
                            • {dica.competicao}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${obterClasseResultado(
                            dica.resultado
                          )}`}
                        >
                          {obterTextoResultado(
                            dica.resultado
                          )}
                        </span>
                      </div>

                      <p className="mt-4 text-sm text-zinc-400">
                        {dica.entrada_sugerida}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-4">
                        <span className="text-sm text-zinc-500">
                          Odd{" "}
                          <strong className="text-white">
                            {formatarOdd(
                              dica.odd
                            )}
                          </strong>
                        </span>

                        <strong
                          className={
                            dica.lucro_prejuizo > 0
                              ? "text-emerald-400"
                              : dica.lucro_prejuizo < 0
                                ? "text-red-400"
                                : "text-zinc-400"
                          }
                        >
                          {formatarUnidades(
                            dica.lucro_prejuizo
                          )}
                        </strong>
                      </div>
                    </article>
                  )
                )}
              </div>
            </>
          )}
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
                disabled={
                  !possuiFiltros
                }
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 xl:w-auto"
              >
                Limpar
              </button>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-800 bg-black px-4 py-3">
            <input
              type="checkbox"
              checked={
                somenteDestaques
              }
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
                {
                  dicasFiltradas.length
                }{" "}
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
            dicas={
              dicasFiltradas
            }
            carregando={
              carregando
            }
            processandoId={
              processandoId
            }
            onExcluir={
              excluirDica
            }
          />
        </section>
      </div>
    </main>
  );
}