"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CardResumoInvestimento from "@/components/investimentos/card-resumo-investimento";
import FormularioInvestimento from "@/components/investimentos/formulario-investimento";
import ListaInvestimentos from "@/components/investimentos/lista-investimentos";
import ModalInvestimento from "@/components/investimentos/modal-investimento";
import { createClient } from "@/lib/supabase/client";

import {
  TIPOS_INVESTIMENTOS,
  calcularResumoInvestimentos,
} from "@/types/investimento";

import type {
  FiltroStatusInvestimento,
  Investimento,
} from "@/types/investimento";

export default function PaginaInvestimentos() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [investimentos, setInvestimentos] =
    useState<Investimento[]>([]);

  const [
    investimentoSelecionado,
    setInvestimentoSelecionado,
  ] = useState<Investimento | null>(null);

  const [busca, setBusca] = useState("");

  const [tipo, setTipo] =
    useState("todos");

  const [status, setStatus] =
    useState<FiltroStatusInvestimento>(
      "todos"
    );

  const [carregando, setCarregando] =
    useState(true);

  const [processandoId, setProcessandoId] =
    useState<number | null>(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] =
    useState("");

  const carregarInvestimentos = useCallback(
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
            .from("investimentos")
            .select(
              `
                id,
                user_id,
                nome,
                tipo,
                instituicao,
                valor_aplicado,
                valor_atual,
                data_aplicacao,
                observacao,
                ativo,
                created_at,
                updated_at
              `
            )
            .eq("user_id", usuario.id)
            .order("ativo", {
              ascending: false,
            })
            .order("data_aplicacao", {
              ascending: false,
            });

        if (error) {
          throw error;
        }

        const registros = (
          data ?? []
        ).map((investimento) => ({
          ...investimento,
          valor_aplicado: Number(
            investimento.valor_aplicado
          ),
          valor_atual: Number(
            investimento.valor_atual
          ),
        })) as Investimento[];

        setInvestimentos(registros);
      } catch (error) {
        console.error(
          "Erro ao carregar investimentos:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os investimentos."
        );
      } finally {
        setCarregando(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void carregarInvestimentos();
  }, [carregarInvestimentos]);

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

  const investimentosFiltrados =
    useMemo(() => {
      const buscaNormalizada = busca
        .trim()
        .toLocaleLowerCase("pt-BR");

      return investimentos.filter(
        (investimento) => {
          const correspondeTipo =
            tipo === "todos" ||
            investimento.tipo === tipo;

          const correspondeStatus =
            status === "todos" ||
            (status === "ativos" &&
              investimento.ativo) ||
            (status === "encerrados" &&
              !investimento.ativo);

          if (
            !correspondeTipo ||
            !correspondeStatus
          ) {
            return false;
          }

          if (!buscaNormalizada) {
            return true;
          }

          const textoPesquisavel = [
            investimento.nome,
            investimento.tipo,
            investimento.instituicao ??
              "",
            investimento.observacao ?? "",
          ]
            .join(" ")
            .toLocaleLowerCase("pt-BR");

          return textoPesquisavel.includes(
            buscaNormalizada
          );
        }
      );
    }, [
      busca,
      investimentos,
      status,
      tipo,
    ]);

  const resumo = useMemo(
    () =>
      calcularResumoInvestimentos(
        investimentos
      ),
    [investimentos]
  );

  const destaqueResultado =
    resumo.resultado > 0
      ? "positivo"
      : resumo.resultado < 0
        ? "negativo"
        : "neutro";

  const destaqueRentabilidade =
    resumo.rentabilidade > 0
      ? "positivo"
      : resumo.rentabilidade < 0
        ? "negativo"
        : "neutro";

  function abrirNovoCadastro() {
    setInvestimentoSelecionado(null);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(
    investimento: Investimento
  ) {
    setInvestimentoSelecionado(
      investimento
    );

    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setInvestimentoSelecionado(null);
  }

  async function concluirSalvamento() {
    const editando =
      Boolean(investimentoSelecionado);

    fecharModal();

    setSucesso(
      editando
        ? "Investimento atualizado com sucesso."
        : "Investimento cadastrado com sucesso."
    );

    await carregarInvestimentos(false);
  }

  async function alterarStatus(
    investimento: Investimento
  ) {
    const novoStatus =
      !investimento.ativo;

    const acao = novoStatus
      ? "reativar"
      : "encerrar";

    const confirmou = window.confirm(
      `Deseja ${acao} o investimento "${investimento.nome}"?`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(investimento.id);
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

      const dataAtualizacao =
        new Date().toISOString();

      const { error } = await supabase
        .from("investimentos")
        .update({
          ativo: novoStatus,
          updated_at: dataAtualizacao,
        })
        .eq("id", investimento.id)
        .eq("user_id", usuario.id);

      if (error) {
        throw error;
      }

      setInvestimentos(
        (estadoAtual) =>
          estadoAtual.map((item) =>
            item.id === investimento.id
              ? {
                  ...item,
                  ativo: novoStatus,
                  updated_at:
                    dataAtualizacao,
                }
              : item
          )
      );

      setSucesso(
        novoStatus
          ? "Investimento reativado com sucesso."
          : "Investimento encerrado com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status do investimento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status do investimento."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirInvestimento(
    investimento: Investimento
  ) {
    const confirmou = window.confirm(
      `Deseja excluir permanentemente o investimento "${investimento.nome}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(investimento.id);
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
        .from("investimentos")
        .delete()
        .eq("id", investimento.id)
        .eq("user_id", usuario.id);

      if (error) {
        throw error;
      }

      setInvestimentos(
        (estadoAtual) =>
          estadoAtual.filter(
            (item) =>
              item.id !== investimento.id
          )
      );

      setSucesso(
        "Investimento excluído com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir investimento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o investimento."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  function limparFiltros() {
    setBusca("");
    setTipo("todos");
    setStatus("todos");
  }

  const possuiFiltros =
    busca.trim() !== "" ||
    tipo !== "todos" ||
    status !== "todos";

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Investimentos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Acompanhe seu patrimônio,
              rentabilidade, lucros e prejuízos
              em suas aplicações.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoCadastro}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          >
            <span
              aria-hidden="true"
              className="text-lg"
            >
              +
            </span>

            Novo investimento
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
              aria-label="Fechar mensagem de sucesso"
              className="shrink-0 text-emerald-400 transition hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <CardResumoInvestimento
            titulo="Total aplicado"
            valor={resumo.totalAplicado}
            descricao="Capital investido atualmente"
            icone="R$"
            destaque="neutro"
          />

          <CardResumoInvestimento
            titulo="Valor atual"
            valor={resumo.valorAtual}
            descricao="Patrimônio atual das aplicações"
            icone="◆"
            destaque="neutro"
          />

          <CardResumoInvestimento
            titulo="Resultado"
            valor={resumo.resultado}
            descricao={
              resumo.resultado >= 0
                ? "Lucro acumulado"
                : "Prejuízo acumulado"
            }
            icone={
              resumo.resultado >= 0
                ? "↗"
                : "↘"
            }
            destaque={destaqueResultado}
          />

          <CardResumoInvestimento
            titulo="Rentabilidade"
            percentual={
              resumo.rentabilidade
            }
            descricao="Retorno sobre o capital aplicado"
            icone="%"
            destaque={
              destaqueRentabilidade
            }
          />

          <CardResumoInvestimento
            titulo="Investimentos ativos"
            quantidade={
              resumo.quantidadeAtivos
            }
            descricao="Aplicações em andamento"
            icone="#"
            destaque="neutro"
          />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]">
            <div>
              <label
                htmlFor="busca-investimento"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Buscar
              </label>

              <input
                id="busca-investimento"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar investimentos..."
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="tipo-investimento-filtro"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Tipo
              </label>

              <select
                id="tipo-investimento-filtro"
                value={tipo}
                onChange={(event) =>
                  setTipo(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todos">
                  Todos os tipos
                </option>

                {TIPOS_INVESTIMENTOS.map(
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
                htmlFor="status-investimento"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Status
              </label>

              <select
                id="status-investimento"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as FiltroStatusInvestimento
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todos">
                  Todos
                </option>

                <option value="ativos">
                  Ativos
                </option>

                <option value="encerrados">
                  Encerrados
                </option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={limparFiltros}
                disabled={!possuiFiltros}
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
              Seus investimentos
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                investimentosFiltrados.length
              }{" "}
              {investimentosFiltrados.length ===
              1
                ? "resultado encontrado"
                : "resultados encontrados"}
            </p>
          </div>

          <ListaInvestimentos
            investimentos={
              investimentosFiltrados
            }
            carregando={carregando}
            processandoId={processandoId}
            onEditar={abrirEdicao}
            onAlterarStatus={alterarStatus}
            onExcluir={excluirInvestimento}
          />
        </section>
      </div>

      <ModalInvestimento
        aberto={modalAberto}
        titulo={
          investimentoSelecionado
            ? "Editar investimento"
            : "Novo investimento"
        }
        onFechar={fecharModal}
      >
        <FormularioInvestimento
          investimento={
            investimentoSelecionado
          }
          onConcluido={
            concluirSalvamento
          }
          onCancelar={fecharModal}
        />
      </ModalInvestimento>
    </main>
  );
}