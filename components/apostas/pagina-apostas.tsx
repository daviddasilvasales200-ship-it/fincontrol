"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import CardResumoAposta from "@/components/apostas/card-resumo-aposta";
import FormularioAposta from "@/components/apostas/formulario-aposta";
import ListaApostas from "@/components/apostas/lista-apostas";
import ModalAposta from "@/components/apostas/modal-aposta";
import { createClient } from "@/lib/supabase/client";
import { calcularResumoApostas } from "@/types/aposta";

import type {
  Aposta,
  DicaParaAposta,
  FiltroResultadoAposta,
} from "@/types/aposta";

type FiltroOrigemAposta =
  | "todas"
  | "manual"
  | "dica";

function normalizarAposta(
  aposta: Record<string, unknown>
): Aposta {
  return {
    id: Number(aposta.id),
    user_id: String(aposta.user_id),

    dica_id:
      aposta.dica_id === null ||
      aposta.dica_id === undefined
        ? null
        : Number(aposta.dica_id),

    fixture_id:
      aposta.fixture_id === null ||
      aposta.fixture_id === undefined
        ? null
        : Number(aposta.fixture_id),

    origem:
      aposta.origem === "dica"
        ? "dica"
        : "manual",

    descricao: String(aposta.descricao),
    modalidade: String(aposta.modalidade),

    competicao: aposta.competicao
      ? String(aposta.competicao)
      : null,

    time_casa: aposta.time_casa
      ? String(aposta.time_casa)
      : null,

    time_visitante: aposta.time_visitante
      ? String(aposta.time_visitante)
      : null,

    casa_aposta: aposta.casa_aposta
      ? String(aposta.casa_aposta)
      : null,

    valor_apostado: Number(
      aposta.valor_apostado
    ),

    odd: Number(aposta.odd),

    retorno_potencial: Number(
      aposta.retorno_potencial
    ),

    resultado:
      aposta.resultado as Aposta["resultado"],

    lucro_prejuizo: Number(
      aposta.lucro_prejuizo
    ),

    data_aposta: String(
      aposta.data_aposta
    ),

    observacao: aposta.observacao
      ? String(aposta.observacao)
      : null,

    created_at: String(
      aposta.created_at
    ),

    updated_at: String(
      aposta.updated_at
    ),
  };
}

export default function PaginaApostas() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const router = useRouter();
  const searchParams = useSearchParams();

  const dicaIdParametro =
    searchParams.get("dica");

  const apostaIdParametro =
    searchParams.get("aposta");

  const [apostas, setApostas] =
    useState<Aposta[]>([]);

  const [apostaSelecionada, setApostaSelecionada] =
    useState<Aposta | null>(null);

  const [dicaOrigem, setDicaOrigem] =
    useState<DicaParaAposta | null>(null);

  const [busca, setBusca] =
    useState("");

  const [competicao, setCompeticao] =
    useState("todas");

  const [resultado, setResultado] =
    useState<FiltroResultadoAposta>(
      "todos"
    );

  const [origem, setOrigem] =
    useState<FiltroOrigemAposta>(
      "todas"
    );

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoDica, setCarregandoDica] =
    useState(false);

  const [carregandoApostaUrl, setCarregandoApostaUrl] =
    useState(false);

  const [processandoId, setProcessandoId] =
    useState<number | null>(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const carregarApostas = useCallback(
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
        } = await supabase.auth.getUser();

        if (usuarioError) {
          throw usuarioError;
        }

        const usuario = usuarioData.user;

        if (!usuario) {
          throw new Error(
            "Sua sessão expirou. Entre novamente."
          );
        }

        const {
          data,
          error,
        } = await supabase
          .from("apostas")
          .select(`
            id,
            user_id,
            dica_id,
            fixture_id,
            origem,
            descricao,
            modalidade,
            competicao,
            time_casa,
            time_visitante,
            casa_aposta,
            valor_apostado,
            odd,
            retorno_potencial,
            resultado,
            lucro_prejuizo,
            data_aposta,
            observacao,
            created_at,
            updated_at
          `)
          .eq("user_id", usuario.id)
          .order("data_aposta", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        const registros: Aposta[] =
          (data ?? []).map(
            (aposta) =>
              normalizarAposta(
                aposta as Record<
                  string,
                  unknown
                >
              )
          );

        setApostas(registros);
      } catch (error) {
        console.error(
          "Erro ao carregar apostas:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as apostas."
        );

        setApostas([]);
      } finally {
        setCarregando(false);
      }
    },
    [supabase]
  );

  const carregarApostaDaUrl =
    useCallback(async () => {
      if (!apostaIdParametro) {
        return;
      }

      const apostaId = Number(
        apostaIdParametro
      );

      if (
        !Number.isInteger(apostaId) ||
        apostaId <= 0
      ) {
        setErro(
          "O identificador da aposta é inválido."
        );
        return;
      }

      setCarregandoApostaUrl(true);
      setErro("");

      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } = await supabase.auth.getUser();

        if (usuarioError) {
          throw usuarioError;
        }

        const usuario = usuarioData.user;

        if (!usuario) {
          throw new Error(
            "Sua sessão expirou. Entre novamente."
          );
        }

        const {
          data,
          error,
        } = await supabase
          .from("apostas")
          .select(`
            id,
            user_id,
            dica_id,
            fixture_id,
            origem,
            descricao,
            modalidade,
            competicao,
            time_casa,
            time_visitante,
            casa_aposta,
            valor_apostado,
            odd,
            retorno_potencial,
            resultado,
            lucro_prejuizo,
            data_aposta,
            observacao,
            created_at,
            updated_at
          `)
          .eq("id", apostaId)
          .eq("user_id", usuario.id)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "A aposta selecionada não foi encontrada."
          );
        }

        const aposta = normalizarAposta(
          data as Record<string, unknown>
        );

        setDicaOrigem(null);
        setApostaSelecionada(aposta);
        setModalAberto(true);
      } catch (error) {
        console.error(
          "Erro ao carregar aposta da URL:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a aposta."
        );
      } finally {
        setCarregandoApostaUrl(false);
      }
    },
    [apostaIdParametro, supabase]
  );

  const carregarDicaDaUrl =
    useCallback(async () => {
      if (
        !dicaIdParametro ||
        apostaIdParametro
      ) {
        return;
      }

      const dicaId = Number(
        dicaIdParametro
      );

      if (
        !Number.isInteger(dicaId) ||
        dicaId <= 0
      ) {
        setErro(
          "O identificador da dica é inválido."
        );
        return;
      }

      setCarregandoDica(true);
      setErro("");

      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } = await supabase.auth.getUser();

        if (usuarioError) {
          throw usuarioError;
        }

        const usuario = usuarioData.user;

        if (!usuario) {
          throw new Error(
            "Sua sessão expirou. Entre novamente."
          );
        }

        const {
          data: apostaExistente,
          error: erroApostaExistente,
        } = await supabase
          .from("apostas")
          .select("id")
          .eq("user_id", usuario.id)
          .eq("dica_id", dicaId)
          .maybeSingle();

        if (erroApostaExistente) {
          throw erroApostaExistente;
        }

        if (apostaExistente) {
          router.replace(
            `/apostas?aposta=${apostaExistente.id}`
          );
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("dicas_apostas")
          .select(`
            id,
            fixture_id,
            esporte,
            competicao,
            time_casa,
            time_visitante,
            data_jogo,
            mercado,
            entrada_sugerida,
            odd,
            resultado
          `)
          .eq("id", dicaId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error(
            "A dica selecionada não foi encontrada."
          );
        }

        const dica: DicaParaAposta = {
          id: Number(data.id),

          fixture_id:
            data.fixture_id === null ||
            data.fixture_id === undefined
              ? null
              : Number(data.fixture_id),

          esporte: String(data.esporte),
          competicao: String(
            data.competicao
          ),
          time_casa: String(
            data.time_casa
          ),
          time_visitante: String(
            data.time_visitante
          ),
          data_jogo: String(
            data.data_jogo
          ),
          mercado: String(data.mercado),
          entrada_sugerida: String(
            data.entrada_sugerida
          ),
          odd: Number(data.odd),
          resultado:
            data.resultado as DicaParaAposta["resultado"],
        };

        setApostaSelecionada(null);
        setDicaOrigem(dica);
        setModalAberto(true);
      } catch (error) {
        console.error(
          "Erro ao carregar dica:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a dica."
        );
      } finally {
        setCarregandoDica(false);
      }
    },
    [
      apostaIdParametro,
      dicaIdParametro,
      router,
      supabase,
    ]
  );

  useEffect(() => {
    void carregarApostas();
  }, [carregarApostas]);

  useEffect(() => {
    void carregarApostaDaUrl();
  }, [carregarApostaDaUrl]);

  useEffect(() => {
    void carregarDicaDaUrl();
  }, [carregarDicaDaUrl]);

  useEffect(() => {
    function atualizarAoVoltar() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void carregarApostas(false);
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
  }, [carregarApostas]);

  const competicoesDisponiveis =
    useMemo(() => {
      const nomes = apostas
        .map((aposta) =>
          aposta.competicao?.trim()
        )
        .filter(
          (item): item is string =>
            Boolean(item)
        );

      return Array.from(
        new Set(nomes)
      ).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      );
    }, [apostas]);

  const apostasFiltradas =
    useMemo(() => {
      const buscaNormalizada = busca
        .trim()
        .toLocaleLowerCase("pt-BR");

      return apostas.filter(
        (aposta) => {
          const correspondeCompeticao =
            competicao === "todas" ||
            aposta.competicao ===
              competicao;

          const correspondeResultado =
            resultado === "todos" ||
            aposta.resultado === resultado;

          const correspondeOrigem =
            origem === "todas" ||
            aposta.origem === origem;

          if (
            !correspondeCompeticao ||
            !correspondeResultado ||
            !correspondeOrigem
          ) {
            return false;
          }

          if (!buscaNormalizada) {
            return true;
          }

          return [
            aposta.descricao,
            aposta.modalidade,
            aposta.competicao ?? "",
            aposta.time_casa ?? "",
            aposta.time_visitante ?? "",
            aposta.casa_aposta ?? "",
            aposta.observacao ?? "",
            aposta.origem,
          ]
            .join(" ")
            .toLocaleLowerCase("pt-BR")
            .includes(buscaNormalizada);
        }
      );
    }, [
      apostas,
      busca,
      competicao,
      origem,
      resultado,
    ]);

  const resumo = useMemo(
    () => calcularResumoApostas(apostas),
    [apostas]
  );

  const resumoDicas = useMemo(() => {
    const apostasDeDicas =
      apostas.filter(
        (aposta) =>
          aposta.origem === "dica"
      );

    const ganhas = apostasDeDicas.filter(
      (aposta) =>
        aposta.resultado === "ganha"
    ).length;

    const perdidas =
      apostasDeDicas.filter(
        (aposta) =>
          aposta.resultado === "perdida"
      ).length;

    const baseTaxa = ganhas + perdidas;

    const taxaAcerto =
      baseTaxa > 0
        ? Number(
            (
              (ganhas / baseTaxa) *
              100
            ).toFixed(2)
          )
        : 0;

    const valorInvestido =
      apostasDeDicas.reduce(
        (total, aposta) =>
          total +
          (Number.isFinite(
            aposta.valor_apostado
          )
            ? aposta.valor_apostado
            : 0),
        0
      );

    const lucroPrejuizo =
      apostasDeDicas.reduce(
        (total, aposta) =>
          total +
          (Number.isFinite(
            aposta.lucro_prejuizo
          )
            ? aposta.lucro_prejuizo
            : 0),
        0
      );

    return {
      quantidade:
        apostasDeDicas.length,
      valorInvestido,
      lucroPrejuizo,
      taxaAcerto,
    };
  }, [apostas]);

  const possuiFiltros =
    busca.trim() !== "" ||
    competicao !== "todas" ||
    resultado !== "todos" ||
    origem !== "todas";

  function limparFiltros() {
    setBusca("");
    setCompeticao("todas");
    setResultado("todos");
    setOrigem("todas");
  }

  function abrirNovoCadastro() {
    setDicaOrigem(null);
    setApostaSelecionada(null);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(
    aposta: Aposta
  ) {
    setDicaOrigem(null);
    setApostaSelecionada(aposta);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setApostaSelecionada(null);
    setDicaOrigem(null);

    if (
      dicaIdParametro ||
      apostaIdParametro
    ) {
      router.replace("/apostas");
    }
  }

  async function concluirSalvamento() {
    const editando = Boolean(
      apostaSelecionada
    );

    const veioDeDica = Boolean(
      dicaOrigem
    );

    fecharModal();

    setSucesso(
      editando
        ? "Aposta atualizada com sucesso."
        : veioDeDica
          ? "Dica adicionada às apostas com sucesso."
          : "Aposta cadastrada com sucesso."
    );

    await carregarApostas(false);
  }

  async function excluirAposta(
    aposta: Aposta
  ) {
    if (
      !window.confirm(
        `Deseja excluir a aposta "${aposta.descricao}"?`
      )
    ) {
      return;
    }

    setProcessandoId(aposta.id);
    setErro("");
    setSucesso("");

    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError) {
        throw usuarioError;
      }

      const usuario = usuarioData.user;

      if (!usuario) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      const { error } = await supabase
        .from("apostas")
        .delete()
        .eq("id", aposta.id)
        .eq("user_id", usuario.id);

      if (error) {
        throw error;
      }

      setApostas((estadoAtual) =>
        estadoAtual.filter(
          (item) =>
            item.id !== aposta.id
        )
      );

      setSucesso(
        "Aposta excluída com sucesso."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a aposta."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Apostas
            </h1>

            <p className="mt-2 text-zinc-500">
              Registre confrontos e acompanhe lucro,
              prejuízo e ROI.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/banca"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-900/70 bg-blue-950/30 px-5 py-3 text-sm font-semibold text-blue-400 transition hover:border-blue-700 hover:bg-blue-950/50 hover:text-blue-300"
            >
              <span aria-hidden="true">
                ◈
              </span>

              Gestão de banca
            </Link>

            <button
              type="button"
              onClick={abrirNovoCadastro}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <span aria-hidden="true">
                ＋
              </span>

              Nova aposta
            </button>
          </div>
        </header>

        {(carregandoDica ||
          carregandoApostaUrl) && (
          <div className="mt-6 rounded-2xl border border-blue-900/60 bg-blue-950/30 px-5 py-4 text-sm text-blue-300">
            {carregandoApostaUrl
              ? "Carregando aposta registrada..."
              : "Carregando dados da dica..."}
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
              onClick={() => setErro("")}
              aria-label="Fechar mensagem de erro"
              className="shrink-0 text-red-400 transition hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-900/70 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300"
          >
            <p>{sucesso}</p>

            <button
              type="button"
              onClick={() =>
                setSucesso("")
              }
              aria-label="Fechar mensagem"
              className="shrink-0 text-emerald-400 transition hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <CardResumoAposta
            titulo="Total apostado"
            valor={resumo.totalApostado}
            descricao="Finalizadas"
            icone="R$"
            destaque="neutro"
          />

          <CardResumoAposta
            titulo="Retorno total"
            valor={resumo.retornoTotal}
            descricao="Recebido"
            icone="↩"
            destaque="neutro"
          />

          <CardResumoAposta
            titulo="Lucro ou prejuízo"
            valor={resumo.lucroPrejuizo}
            descricao="Acumulado"
            icone="↗"
            destaque={
              resumo.lucroPrejuizo >= 0
                ? "positivo"
                : "negativo"
            }
          />

          <CardResumoAposta
            titulo="ROI"
            percentual={resumo.roi}
            descricao="Retorno"
            icone="%"
            destaque={
              resumo.roi >= 0
                ? "positivo"
                : "negativo"
            }
          />

          <CardResumoAposta
            titulo="Pendentes"
            quantidade={
              resumo.quantidadePendentes
            }
            descricao="Aguardando"
            icone="⌛"
            destaque="neutro"
          />

          <CardResumoAposta
            titulo="Ganhas"
            quantidade={
              resumo.quantidadeGanhas
            }
            descricao="Positivas"
            icone="✓"
            destaque="positivo"
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-blue-900/50 bg-blue-950/10">
          <div className="border-b border-blue-900/40 px-5 py-4">
            <h2 className="font-bold text-blue-300">
              Resultado real das dicas utilizadas
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Considera somente dicas que foram
              registradas como apostas.
            </p>
          </div>

          <div className="grid gap-px bg-blue-900/30 sm:grid-cols-2 xl:grid-cols-4">
            <div className="bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Dicas aproveitadas
              </p>

              <p className="mt-2 text-2xl font-bold text-blue-400">
                {resumoDicas.quantidade}
              </p>
            </div>

            <div className="bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Valor investido
              </p>

              <p className="mt-2 text-2xl font-bold text-white">
                {new Intl.NumberFormat(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                ).format(
                  resumoDicas.valorInvestido
                )}
              </p>
            </div>

            <div className="bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Lucro real
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  resumoDicas.lucroPrejuizo > 0
                    ? "text-emerald-400"
                    : resumoDicas.lucroPrejuizo < 0
                      ? "text-red-400"
                      : "text-zinc-300"
                }`}
              >
                {new Intl.NumberFormat(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  }
                ).format(
                  resumoDicas.lucroPrejuizo
                )}
              </p>
            </div>

            <div className="bg-zinc-950 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Taxa de acerto
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-400">
                {new Intl.NumberFormat(
                  "pt-BR",
                  {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1,
                  }
                ).format(
                  resumoDicas.taxaAcerto
                )}%
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="mb-5">
            <p className="mb-3 text-sm font-medium text-zinc-400">
              Origem das apostas
            </p>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  {
                    valor: "todas",
                    texto: "Todas",
                  },
                  {
                    valor: "manual",
                    texto: "Manuais",
                  },
                  {
                    valor: "dica",
                    texto: "Vindas de dicas",
                  },
                ] as const
              ).map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() =>
                    setOrigem(opcao.valor)
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    origem === opcao.valor
                      ? "border-blue-600 bg-blue-950/50 text-blue-300"
                      : "border-zinc-800 bg-black text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {opcao.texto}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_260px_180px_auto]">
            <input
              value={busca}
              onChange={(event) =>
                setBusca(
                  event.target.value
                )
              }
              placeholder="Buscar por confronto, modalidade ou casa..."
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
            />

            <select
              value={competicao}
              onChange={(event) =>
                setCompeticao(
                  event.target.value
                )
              }
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600"
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

            <select
              value={resultado}
              onChange={(event) =>
                setResultado(
                  event.target
                    .value as FiltroResultadoAposta
                )
              }
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600"
            >
              <option value="todos">
                Todos
              </option>
              <option value="pendente">
                Pendentes
              </option>
              <option value="ganha">
                Ganhas
              </option>
              <option value="perdida">
                Perdidas
              </option>
              <option value="anulada">
                Anuladas
              </option>
            </select>

            <button
              type="button"
              onClick={limparFiltros}
              disabled={!possuiFiltros}
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Limpar
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 pt-4 text-sm">
            <p className="text-zinc-500">
              {apostasFiltradas.length}{" "}
              {apostasFiltradas.length === 1
                ? "aposta encontrada"
                : "apostas encontradas"}
            </p>

            {origem !== "todas" && (
              <span className="rounded-full border border-blue-900/60 bg-blue-950/30 px-3 py-1 text-xs font-semibold text-blue-400">
                {origem === "dica"
                  ? "Vindas de dicas"
                  : "Manuais"}
              </span>
            )}
          </div>
        </section>

        <section className="mt-8">
          <ListaApostas
            apostas={apostasFiltradas}
            carregando={carregando}
            processandoId={processandoId}
            onEditar={abrirEdicao}
            onExcluir={excluirAposta}
          />
        </section>
      </div>

      <ModalAposta
        aberto={modalAberto}
        titulo={
          apostaSelecionada
            ? "Editar aposta"
            : dicaOrigem
              ? "Usar dica como aposta"
              : "Nova aposta"
        }
        onFechar={fecharModal}
      >
        <FormularioAposta
          aposta={apostaSelecionada}
          dicaOrigem={dicaOrigem}
          carregandoExterno={
            carregandoDica ||
            carregandoApostaUrl
          }
          onConcluido={concluirSalvamento}
          onCancelar={fecharModal}
        />
      </ModalAposta>
    </main>
  );
}
