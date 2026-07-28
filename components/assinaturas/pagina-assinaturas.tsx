"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CardResumoAssinatura from "@/components/assinaturas/card-resumo-assinatura";
import FormularioAssinatura from "@/components/assinaturas/formulario-assinatura";
import ListaAssinaturas from "@/components/assinaturas/lista-assinaturas";
import ModalAssinatura from "@/components/assinaturas/modal-assinatura";
import { createClient } from "@/lib/supabase/client";

import {
  CATEGORIAS_ASSINATURAS,
  calcularResumoAssinaturas,
} from "@/types/assinatura";

import type {
  Assinatura,
  FiltroStatusAssinatura,
} from "@/types/assinatura";

export default function PaginaAssinaturas() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [assinaturas, setAssinaturas] =
    useState<Assinatura[]>([]);

  const [assinaturaSelecionada, setAssinaturaSelecionada] =
    useState<Assinatura | null>(null);

  const [busca, setBusca] = useState("");

  const [categoria, setCategoria] =
    useState("todas");

  const [status, setStatus] =
    useState<FiltroStatusAssinatura>("todas");

  const [carregando, setCarregando] =
    useState(true);

  const [processandoId, setProcessandoId] =
    useState<number | null>(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] =
    useState("");

  const carregarAssinaturas = useCallback(
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

        const { data, error } = await supabase
          .from("assinaturas")
          .select(
            `
              id,
              user_id,
              nome,
              categoria,
              valor,
              dia_vencimento,
              data_inicio,
              observacao,
              ativa,
              created_at
            `
          )
          .eq("user_id", usuario.id)
          .order("ativa", {
            ascending: false,
          })
          .order("dia_vencimento", {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        const registros = (data ?? []).map(
          (assinatura) => ({
            ...assinatura,
            valor: Number(assinatura.valor),
            dia_vencimento: Number(
              assinatura.dia_vencimento
            ),
          })
        ) as Assinatura[];

        setAssinaturas(registros);
      } catch (error) {
        console.error(
          "Erro ao carregar assinaturas:",
          error
        );

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as assinaturas."
        );
      } finally {
        setCarregando(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void carregarAssinaturas();
  }, [carregarAssinaturas]);

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

  const assinaturasFiltradas = useMemo(() => {
    const buscaNormalizada = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return assinaturas.filter((assinatura) => {
      const correspondeCategoria =
        categoria === "todas" ||
        assinatura.categoria === categoria;

      const correspondeStatus =
        status === "todas" ||
        (status === "ativas" &&
          assinatura.ativa) ||
        (status === "inativas" &&
          !assinatura.ativa);

      if (
        !correspondeCategoria ||
        !correspondeStatus
      ) {
        return false;
      }

      if (!buscaNormalizada) {
        return true;
      }

      const textoPesquisavel = [
        assinatura.nome,
        assinatura.categoria,
        assinatura.observacao ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return textoPesquisavel.includes(
        buscaNormalizada
      );
    });
  }, [
    assinaturas,
    busca,
    categoria,
    status,
  ]);

  const resumo = useMemo(
    () =>
      calcularResumoAssinaturas(
        assinaturas
      ),
    [assinaturas]
  );

  function abrirNovoCadastro() {
    setAssinaturaSelecionada(null);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(
    assinatura: Assinatura
  ) {
    setAssinaturaSelecionada(
      assinatura
    );

    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setAssinaturaSelecionada(null);
  }

  async function concluirSalvamento() {
    const editando =
      Boolean(assinaturaSelecionada);

    fecharModal();

    setSucesso(
      editando
        ? "Assinatura atualizada com sucesso."
        : "Assinatura cadastrada com sucesso."
    );

    await carregarAssinaturas(false);
  }

  async function alterarStatus(
    assinatura: Assinatura
  ) {
    const novoStatus = !assinatura.ativa;

    const acao = novoStatus
      ? "reativar"
      : "desativar";

    const confirmou = window.confirm(
      `Deseja ${acao} a assinatura "${assinatura.nome}"?`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(assinatura.id);
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
        .from("assinaturas")
        .update({
          ativa: novoStatus,
        })
        .eq("id", assinatura.id)
        .eq("user_id", usuario.id);

      if (error) {
        throw error;
      }

      setAssinaturas((estadoAtual) =>
        estadoAtual.map((item) =>
          item.id === assinatura.id
            ? {
                ...item,
                ativa: novoStatus,
              }
            : item
        )
      );

      setSucesso(
        novoStatus
          ? "Assinatura reativada com sucesso."
          : "Assinatura desativada com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status da assinatura:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status da assinatura."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  async function excluirAssinatura(
    assinatura: Assinatura
  ) {
    const confirmou = window.confirm(
      `Deseja excluir permanentemente a assinatura "${assinatura.nome}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmou) {
      return;
    }

    setProcessandoId(assinatura.id);
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
        .from("assinaturas")
        .delete()
        .eq("id", assinatura.id)
        .eq("user_id", usuario.id);

      if (error) {
        throw error;
      }

      setAssinaturas((estadoAtual) =>
        estadoAtual.filter(
          (item) =>
            item.id !== assinatura.id
        )
      );

      setSucesso(
        "Assinatura excluída com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir assinatura:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a assinatura."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  function limparFiltros() {
    setBusca("");
    setCategoria("todas");
    setStatus("todas");
  }

  const possuiFiltros =
    busca.trim() !== "" ||
    categoria !== "todas" ||
    status !== "todas";

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Assinaturas
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              Controle serviços recorrentes,
              vencimentos e o impacto mensal no
              seu orçamento.
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

            Nova assinatura
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
          <CardResumoAssinatura
            titulo="Custo mensal"
            valor={resumo.custoMensal}
            descricao="Soma das assinaturas ativas"
            icone="R$"
            destaque="negativo"
          />

          <CardResumoAssinatura
            titulo="Custo anual"
            valor={resumo.custoAnual}
            descricao="Estimativa para 12 meses"
            icone="↗"
            destaque="negativo"
          />

          <CardResumoAssinatura
            titulo="Assinaturas ativas"
            quantidade={
              resumo.quantidadeAtivas
            }
            descricao="Serviços gerando cobranças"
            icone="●"
            destaque="positivo"
          />

          <CardResumoAssinatura
            titulo="Assinaturas inativas"
            quantidade={
              resumo.quantidadeInativas
            }
            descricao="Serviços pausados ou cancelados"
            icone="○"
            destaque="neutro"
          />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]">
            <div>
              <label
                htmlFor="busca-assinatura"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Buscar
              </label>

              <input
                id="busca-assinatura"
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(
                    event.target.value
                  )
                }
                placeholder="Buscar assinaturas..."
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label
                htmlFor="categoria-assinatura-filtro"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Categoria
              </label>

              <select
                id="categoria-assinatura-filtro"
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

                {CATEGORIAS_ASSINATURAS.map(
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
                htmlFor="status-assinatura"
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Status
              </label>

              <select
                id="status-assinatura"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as FiltroStatusAssinatura
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todas">
                  Todas
                </option>

                <option value="ativas">
                  Ativas
                </option>

                <option value="inativas">
                  Inativas
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
              Suas assinaturas
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              {assinaturasFiltradas.length}{" "}
              {assinaturasFiltradas.length ===
              1
                ? "resultado encontrado"
                : "resultados encontrados"}
            </p>
          </div>

          <ListaAssinaturas
            assinaturas={
              assinaturasFiltradas
            }
            carregando={carregando}
            processandoId={processandoId}
            onEditar={abrirEdicao}
            onAlterarStatus={alterarStatus}
            onExcluir={excluirAssinatura}
          />
        </section>
      </div>

      <ModalAssinatura
        aberto={modalAberto}
        titulo={
          assinaturaSelecionada
            ? "Editar assinatura"
            : "Nova assinatura"
        }
        onFechar={fecharModal}
      >
        <FormularioAssinatura
          assinatura={
            assinaturaSelecionada
          }
          onConcluido={
            concluirSalvamento
          }
          onCancelar={fecharModal}
        />
      </ModalAssinatura>
    </main>
  );
}