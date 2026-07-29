"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CardResumoAposta from "@/components/apostas/card-resumo-aposta";
import FormularioAposta from "@/components/apostas/formulario-aposta";
import ListaApostas from "@/components/apostas/lista-apostas";
import ModalAposta from "@/components/apostas/modal-aposta";
import { createClient } from "@/lib/supabase/client";

import {
  calcularResumoApostas,
} from "@/types/aposta";

import type {
  Aposta,
  FiltroResultadoAposta,
} from "@/types/aposta";

export default function PaginaApostas() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [apostas, setApostas] =
    useState<Aposta[]>([]);

  const [
    apostaSelecionada,
    setApostaSelecionada,
  ] = useState<Aposta | null>(null);

  const [busca, setBusca] = useState("");

  const [competicao, setCompeticao] =
    useState("todas");

  const [resultado, setResultado] =
    useState<FiltroResultadoAposta>("todos");

  const [carregando, setCarregando] =
    useState(true);

  const [processandoId, setProcessandoId] =
    useState<number | null>(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] =
    useState("");

  const carregarApostas = useCallback(
    async (mostrarCarregamento = true) => {
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

        const { data, error } =
          await supabase
            .from("apostas")
            .select(
              `
                id,
                user_id,
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
              `
            )
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

        const registros: Aposta[] = (
          data ?? []
        ).map((aposta) => ({
          id: Number(aposta.id),

          user_id: String(
            aposta.user_id
          ),

          descricao: String(
            aposta.descricao
          ),

          modalidade: String(
            aposta.modalidade
          ),

          competicao:
            aposta.competicao
              ? String(aposta.competicao)
              : null,

          time_casa:
            aposta.time_casa
              ? String(aposta.time_casa)
              : null,

          time_visitante:
            aposta.time_visitante
              ? String(
                  aposta.time_visitante
                )
              : null,

          casa_aposta:
            aposta.casa_aposta
              ? String(
                  aposta.casa_aposta
                )
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

          observacao:
            aposta.observacao
              ? String(
                  aposta.observacao
                )
              : null,

          created_at: String(
            aposta.created_at
          ),

          updated_at: String(
            aposta.updated_at
          ),
        }));

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

  useEffect(() => {
    void carregarApostas();
  }, [carregarApostas]);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        setSucesso("");
      }, 4000);

    return () => {
      window.clearTimeout(
        temporizador
      );
    };
  }, [sucesso]);

  const competicoesDisponiveis =
    useMemo(() => {
      const competicoes = apostas
        .map((aposta) =>
          aposta.competicao?.trim()
        )
        .filter(
          (
            item
          ): item is string =>
            Boolean(item)
        );

      return Array.from(
        new Set(competicoes)
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "pt-BR"
        )
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
            aposta.resultado ===
              resultado;

          if (
            !correspondeCompeticao ||
            !correspondeResultado
          ) {
            return false;
          }

          if (!buscaNormalizada) {
            return true;
          }

          const textoPesquisavel = [
            aposta.descricao,
            aposta.modalidade,
            aposta.competicao ?? "",
            aposta.time_casa ?? "",
            aposta.time_visitante ?? "",
            aposta.casa_aposta ?? "",
            aposta.observacao ?? "",
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
      apostas,
      busca,
      competicao,
      resultado,
    ]);

  const resumo = useMemo(
    () =>
      calcularResumoApostas(
        apostas
      ),
    [apostas]
  );

  const destaqueLucro:
    | "positivo"
    | "negativo"
    | "neutro" =
    resumo.lucroPrejuizo > 0
      ? "positivo"
      : resumo.lucroPrejuizo < 0
        ? "negativo"
        : "neutro";

  const destaqueRoi:
    | "positivo"
    | "negativo"
    | "neutro" =
    resumo.roi > 0
      ? "positivo"
      : resumo.roi < 0
        ? "negativo"
        : "neutro";

  function abrirNovoCadastro() {
    setApostaSelecionada(null);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(
    aposta: Aposta
  ) {
    setApostaSelecionada(aposta);
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setApostaSelecionada(null);
  }

  async function concluirSalvamento() {
    const editando = Boolean(
      apostaSelecionada
    );

    fecharModal();

    setSucesso(
      editando
        ? "Aposta atualizada com sucesso."
        : "Aposta cadastrada com sucesso."
    );

    await carregarApostas(false);
  }

  async function excluirAposta(
    aposta: Aposta
  ) {
    const confirmou =
      window.confirm(
        `Deseja excluir permanentemente a aposta "${aposta.descricao}"?\n\nEssa ação não poderá ser desfeita.`
      );

    if (!confirmou) {
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

      const { error } =
        await supabase
          .from("apostas")
          .delete()
          .eq("id", aposta.id)
          .eq(
            "user_id",
            usuario.id
          );

      if (error) {
        throw error;
      }

      setApostas(
        (estadoAtual) =>
          estadoAtual.filter(
            (item) =>
              item.id !==
              aposta.id
          )
      );

      setSucesso(
        "Aposta excluída com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir aposta:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a aposta."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  function limparFiltros() {
    setBusca("");
    setCompeticao("todas");
    setResultado("todos");
  }

  const possuiFiltros =
    busca.trim() !== "" ||
    competicao !== "todas" ||
    resultado !== "todos";

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Apostas
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Registre confrontos,
              acompanhe resultados e
              analise lucro, prejuízo e
              ROI.
            </p>
          </div>

          <button
            type="button"
            onClick={
              abrirNovoCadastro
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          >
            <span
              aria-hidden="true"
              className="text-lg"
            >
              +
            </span>

            Nova aposta
          </button>
        </header>

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
              aria-label="Fechar mensagem de sucesso"
              className="shrink-0 text-emerald-400 transition hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <CardResumoAposta
            titulo="Total apostado"
            valor={
              resumo.totalApostado
            }
            descricao="Valor das apostas finalizadas"
            icone="R$"
            destaque="neutro"
          />

          <CardResumoAposta
            titulo="Retorno total"
            valor={
              resumo.retornoTotal
            }
            descricao="Retorno recebido nas finalizadas"
            icone="↩"
            destaque="neutro"
          />

          <CardResumoAposta
            titulo="Lucro ou prejuízo"
            valor={
              resumo.lucroPrejuizo
            }
            descricao="Resultado acumulado"
            icone={
              resumo.lucroPrejuizo >=
              0
                ? "↗"
                : "↘"
            }
            destaque={
              destaqueLucro
            }
          />

          <CardResumoAposta
            titulo="ROI"
            percentual={resumo.roi}
            descricao="Retorno sobre o valor apostado"
            icone="%"
            destaque={destaqueRoi}
          />

          <CardResumoAposta
            titulo="Pendentes"
            quantidade={
              resumo.quantidadePendentes
            }
            descricao="Aguardando resultado"
            icone="⌛"
            destaque="neutro"
          />

          <CardResumoAposta
            titulo="Apostas ganhas"
            quantidade={
              resumo.quantidadeGanhas
            }
            descricao="Resultados positivos"
            icone="✓"
            destaque="positivo"
          />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px_180px_auto]">
            <div>
              <label
                htmlFor="busca-aposta"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Buscar
              </label>

              <input
                id="busca-aposta"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar por time, descrição ou casa..."
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="competicao-aposta-filtro"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Competição
              </label>

              <select
                id="competicao-aposta-filtro"
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
                htmlFor="resultado-aposta-filtro"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Resultado
              </label>

              <select
                id="resultado-aposta-filtro"
                value={resultado}
                onChange={(event) =>
                  setResultado(
                    event.target
                      .value as FiltroResultadoAposta
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
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
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={
                  limparFiltros
                }
                disabled={
                  !possuiFiltros
                }
                className="w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
              >
                Limpar
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              Suas apostas
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                apostasFiltradas.length
              }{" "}
              {apostasFiltradas.length ===
              1
                ? "resultado encontrado"
                : "resultados encontrados"}
            </p>
          </div>

          <ListaApostas
            apostas={
              apostasFiltradas
            }
            carregando={
              carregando
            }
            processandoId={
              processandoId
            }
            onEditar={
              abrirEdicao
            }
            onExcluir={
              excluirAposta
            }
          />
        </section>
      </div>

      <ModalAposta
        aberto={modalAberto}
        titulo={
          apostaSelecionada
            ? "Editar aposta"
            : "Nova aposta"
        }
        onFechar={fecharModal}
      >
        <FormularioAposta
          aposta={
            apostaSelecionada
          }
          onConcluido={
            concluirSalvamento
          }
          onCancelar={
            fecharModal
          }
        />
      </ModalAposta>
    </main>
  );
}