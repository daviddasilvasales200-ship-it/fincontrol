"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CardResumoParcelamento from "@/components/parcelamentos/card-resumo-parcelamento";
import FormularioParcelamento from "@/components/parcelamentos/formulario-parcelamento";
import ListaParcelamentos from "@/components/parcelamentos/lista-parcelamentos";
import ModalParcelamento from "@/components/parcelamentos/modal-parcelamento";
import { createClient } from "@/lib/supabase/client";

import {
  CATEGORIAS_PARCELAMENTOS,
  obterStatusParcelamento,
} from "@/types/parcelamento";

import type {
  ParcelaMovimentacao,
  Parcelamento,
  StatusParcelamento,
} from "@/types/parcelamento";

type FiltroStatus =
  | "todos"
  | StatusParcelamento;

function obterDataLocalAtual() {
  const hoje = new Date();

  const ano = hoje.getFullYear();
  const mes = String(
    hoje.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    hoje.getDate()
  ).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function formatarMoeda(valor: number | string) {
  const valorNumerico = Number(valor);

  if (!Number.isFinite(valorNumerico)) {
    return "R$ 0,00";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
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

export default function PaginaParcelamentos() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [parcelamentos, setParcelamentos] =
    useState<Parcelamento[]>([]);

  const [parcelasSelecionadas, setParcelasSelecionadas] =
    useState<ParcelaMovimentacao[]>([]);

  const [
    parcelamentoSelecionado,
    setParcelamentoSelecionado,
  ] = useState<Parcelamento | null>(null);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] =
    useState("todas");

  const [status, setStatus] =
    useState<FiltroStatus>("todos");

  const [carregando, setCarregando] =
    useState(true);

  const [
    carregandoParcelas,
    setCarregandoParcelas,
  ] = useState(false);

  const [processandoId, setProcessandoId] =
    useState<number | null>(null);

  const [modalNovoAberto, setModalNovoAberto] =
    useState(false);

  const [
    modalParcelasAberto,
    setModalParcelasAberto,
  ] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] =
    useState("");

  const carregarParcelamentos = useCallback(
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

        const { data, error } =
          await supabase
            .from("parcelamentos")
            .select(
              `
                id,
                user_id,
                descricao,
                categoria,
                valor_total,
                quantidade_parcelas,
                valor_parcela,
                data_primeira_parcela,
                observacao,
                ativo,
                created_at,
                updated_at
              `
            )
            .eq("user_id", usuario.id)
            .order("created_at", {
              ascending: false,
            });

        if (error) {
          throw error;
        }

        const registros = (
          data ?? []
        ).map((parcelamento) => ({
          ...parcelamento,
          valor_total: Number(
            parcelamento.valor_total
          ),
          valor_parcela: Number(
            parcelamento.valor_parcela
          ),
          quantidade_parcelas: Number(
            parcelamento.quantidade_parcelas
          ),
        })) as Parcelamento[];

        setParcelamentos(registros);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os parcelamentos."
        );
      } finally {
        setCarregando(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void carregarParcelamentos();
  }, [carregarParcelamentos]);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        setSucesso("");
      }, 4000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [sucesso]);

  const parcelamentosFiltrados =
    useMemo(() => {
      const buscaNormalizada = busca
        .trim()
        .toLocaleLowerCase("pt-BR");

      return parcelamentos.filter(
        (parcelamento) => {
          const statusParcelamento =
            obterStatusParcelamento(
              parcelamento
            );

          const correspondeStatus =
            status === "todos" ||
            statusParcelamento === status;

          const correspondeCategoria =
            categoria === "todas" ||
            parcelamento.categoria ===
              categoria;

          if (
            !correspondeStatus ||
            !correspondeCategoria
          ) {
            return false;
          }

          if (!buscaNormalizada) {
            return true;
          }

          const textoPesquisavel = [
            parcelamento.descricao,
            parcelamento.categoria,
            parcelamento.observacao ?? "",
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
      categoria,
      parcelamentos,
      status,
    ]);

  const resumo = useMemo(() => {
    const ativos = parcelamentos.filter(
      (parcelamento) =>
        obterStatusParcelamento(
          parcelamento
        ) === "ativo"
    );

    const valorTotalAtivo =
      ativos.reduce(
        (total, parcelamento) =>
          total +
          Number(
            parcelamento.valor_total
          ),
        0
      );

    const compromissoMensal =
      ativos.reduce(
        (total, parcelamento) =>
          total +
          Number(
            parcelamento.valor_parcela
          ),
        0
      );

    const parcelasRestantes =
      ativos.reduce(
        (total, parcelamento) => {
          const hoje = new Date();

          const inicio = new Date(
            `${parcelamento.data_primeira_parcela}T12:00:00`
          );

          const mesesDecorridos =
            (hoje.getFullYear() -
              inicio.getFullYear()) *
              12 +
            (hoje.getMonth() -
              inicio.getMonth());

          const parcelaAtual = Math.min(
            Math.max(
              mesesDecorridos + 1,
              0
            ),
            parcelamento.quantidade_parcelas
          );

          return (
            total +
            Math.max(
              parcelamento.quantidade_parcelas -
                parcelaAtual,
              0
            )
          );
        },
        0
      );

    return {
      ativos: ativos.length,
      valorTotalAtivo,
      compromissoMensal,
      parcelasRestantes,
    };
  }, [parcelamentos]);

  async function concluirCadastro() {
    setModalNovoAberto(false);

    setSucesso(
      "Parcelamento criado e despesas mensais geradas com sucesso."
    );

    await carregarParcelamentos(false);
  }

  async function visualizarParcelas(
    parcelamento: Parcelamento
  ) {
    setParcelamentoSelecionado(
      parcelamento
    );

    setParcelasSelecionadas([]);
    setCarregandoParcelas(true);
    setErro("");
    setModalParcelasAberto(true);

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
          .from("movimentacoes")
          .select(
            `
              id,
              user_id,
              tipo,
              descricao,
              categoria,
              valor,
              data,
              observacao,
              parcelamento_id,
              numero_parcela,
              total_parcelas,
              competencia,
              created_at,
              updated_at
            `
          )
          .eq("user_id", usuario.id)
          .eq(
            "parcelamento_id",
            parcelamento.id
          )
          .order("numero_parcela", {
            ascending: true,
          });

      if (error) {
        throw error;
      }

      const registros = (
        data ?? []
      ).map((parcela) => ({
        ...parcela,
        valor: Number(parcela.valor),
      })) as ParcelaMovimentacao[];

      setParcelasSelecionadas(registros);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as parcelas."
      );
    } finally {
      setCarregandoParcelas(false);
    }
  }

  function fecharModalParcelas() {
    if (carregandoParcelas) {
      return;
    }

    setModalParcelasAberto(false);
    setParcelamentoSelecionado(null);
    setParcelasSelecionadas([]);
  }

  async function cancelarParcelamento(
    parcelamento: Parcelamento
  ) {
    const confirmou = window.confirm(
      `Deseja cancelar o parcelamento "${parcelamento.descricao}"?\n\nAs parcelas futuras serão removidas. As parcelas anteriores permanecerão no histórico.`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(parcelamento.id);
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

      const hoje = obterDataLocalAtual();

      const {
        error: movimentacoesError,
      } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("user_id", usuario.id)
        .eq(
          "parcelamento_id",
          parcelamento.id
        )
        .gte("data", hoje);

      if (movimentacoesError) {
        throw movimentacoesError;
      }

      const {
        error: parcelamentoError,
      } = await supabase
        .from("parcelamentos")
        .update({
          ativo: false,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", parcelamento.id)
        .eq("user_id", usuario.id);

      if (parcelamentoError) {
        throw parcelamentoError;
      }

      setParcelamentos(
        (estadoAtual) =>
          estadoAtual.map((item) =>
            item.id === parcelamento.id
              ? {
                  ...item,
                  ativo: false,
                  updated_at:
                    new Date().toISOString(),
                }
              : item
          )
      );

      setSucesso(
        "Parcelamento cancelado e parcelas futuras removidas."
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar o parcelamento."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  function limparFiltros() {
    setBusca("");
    setCategoria("todas");
    setStatus("todos");
  }

  const possuiFiltros =
    busca.trim() !== "" ||
    categoria !== "todas" ||
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
              Parcelamentos
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Organize compras parceladas e
              acompanhe o impacto mensal no seu
              orçamento.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalNovoAberto(true)
            }
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          >
            <span
              aria-hidden="true"
              className="text-lg"
            >
              +
            </span>

            Novo parcelamento
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

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardResumoParcelamento
            titulo="Parcelamentos ativos"
            quantidade={resumo.ativos}
            descricao="Compras ainda em andamento"
            icone="▦"
            destaque="neutro"
          />

          <CardResumoParcelamento
            titulo="Total parcelado"
            valor={resumo.valorTotalAtivo}
            descricao="Valor total dos parcelamentos ativos"
            icone="R$"
            destaque="negativo"
          />

          <CardResumoParcelamento
            titulo="Compromisso mensal"
            valor={resumo.compromissoMensal}
            descricao="Soma aproximada das parcelas mensais"
            icone="↘"
            destaque="negativo"
          />

          <CardResumoParcelamento
            titulo="Parcelas restantes"
            quantidade={
              resumo.parcelasRestantes
            }
            descricao="Quantidade total ainda pendente"
            icone="#"
            destaque="neutro"
          />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]">
            <div>
              <label
                htmlFor="busca-parcelamento"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Buscar
              </label>

              <input
                id="busca-parcelamento"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Buscar parcelamentos..."
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="categoria-parcelamento-filtro"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Categoria
              </label>

              <select
                id="categoria-parcelamento-filtro"
                value={categoria}
                onChange={(event) =>
                  setCategoria(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todas">
                  Todas as categorias
                </option>

                {CATEGORIAS_PARCELAMENTOS.map(
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
                htmlFor="status-parcelamento"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Status
              </label>

              <select
                id="status-parcelamento"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as FiltroStatus
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todos">
                  Todos
                </option>

                <option value="ativo">
                  Ativos
                </option>

                <option value="concluido">
                  Concluídos
                </option>

                <option value="cancelado">
                  Cancelados
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
              Seus parcelamentos
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {
                parcelamentosFiltrados.length
              }{" "}
              {parcelamentosFiltrados.length ===
              1
                ? "resultado encontrado"
                : "resultados encontrados"}
            </p>
          </div>

          <ListaParcelamentos
            parcelamentos={
              parcelamentosFiltrados
            }
            carregando={carregando}
            processandoId={processandoId}
            onVerParcelas={
              visualizarParcelas
            }
            onCancelar={
              cancelarParcelamento
            }
          />
        </section>
      </div>

      <ModalParcelamento
        aberto={modalNovoAberto}
        titulo="Novo parcelamento"
        onFechar={() =>
          setModalNovoAberto(false)
        }
      >
        <FormularioParcelamento
          onConcluido={concluirCadastro}
          onCancelar={() =>
            setModalNovoAberto(false)
          }
        />
      </ModalParcelamento>

      <ModalParcelamento
        aberto={modalParcelasAberto}
        titulo={
          parcelamentoSelecionado
            ? `Parcelas de ${parcelamentoSelecionado.descricao}`
            : "Parcelas"
        }
        onFechar={fecharModalParcelas}
      >
        {carregandoParcelas ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-red-500" />

            <p className="mt-4 text-sm text-zinc-500">
              Carregando parcelas...
            </p>
          </div>
        ) : parcelasSelecionadas.length ===
          0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center">
            <p className="text-zinc-400">
              Nenhuma parcela encontrada.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {parcelasSelecionadas.map(
              (parcela) => (
                <article
                  key={parcela.id}
                  className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-black p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">
                      Parcela{" "}
                      {parcela.numero_parcela}/
                      {parcela.total_parcelas}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {formatarData(
                        parcela.data
                      )}
                    </p>
                  </div>

                  <p className="font-bold text-red-400">
                    {formatarMoeda(
                      parcela.valor
                    )}
                  </p>
                </article>
              )
            )}
          </div>
        )}
      </ModalParcelamento>
    </main>
  );
}