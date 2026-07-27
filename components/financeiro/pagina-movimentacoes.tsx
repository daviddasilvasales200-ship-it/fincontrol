"use client";

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import CardResumoMovimentacao from "@/components/financeiro/card-resumo-movimentacao";
import FormularioMovimentacao from "@/components/financeiro/formulario-movimentacao";
import ListaMovimentacoes from "@/components/financeiro/lista-movimentacoes";
import ModalMovimentacao from "@/components/financeiro/modal-movimentacao";
import { createClient } from "@/lib/supabase/client";

import {
  converterFormularioParaMovimentacao,
  obterCategoriasPorTipo,
} from "@/types/movimentacao";

import type {
  FormularioMovimentacao as DadosFormularioMovimentacao,
  Movimentacao,
  TipoMovimentacao,
} from "@/types/movimentacao";

type PaginaMovimentacoesProps = {
  tipo: TipoMovimentacao;
};

function obterMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(
    2,
    "0"
  );

  return `${ano}-${mes}`;
}

function obterIntervaloDoMes(mesSelecionado: string) {
  const [ano, mes] = mesSelecionado
    .split("-")
    .map(Number);

  const primeiroDia = `${ano}-${String(mes).padStart(
    2,
    "0"
  )}-01`;

  const proximoMes = new Date(ano, mes, 1);

  const primeiroDiaProximoMes = [
    proximoMes.getFullYear(),
    String(proximoMes.getMonth() + 1).padStart(2, "0"),
    "01",
  ].join("-");

  return {
    primeiroDia,
    primeiroDiaProximoMes,
  };
}

function formatarMes(mesSelecionado: string) {
  const [ano, mes] = mesSelecionado
    .split("-")
    .map(Number);

  if (!ano || !mes) {
    return mesSelecionado;
  }

  const nomeMes = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(ano, mes - 1, 1));

  return (
    nomeMes.charAt(0).toUpperCase() +
    nomeMes.slice(1)
  );
}

export default function PaginaMovimentacoes({
  tipo,
}: PaginaMovimentacoesProps) {
  const supabase = useMemo(() => createClient(), []);

  const categorias = useMemo(
    () => obterCategoriasPorTipo(tipo),
    [tipo]
  );

  const [movimentacoes, setMovimentacoes] = useState<
    Movimentacao[]
  >([]);

  const [mesSelecionado, setMesSelecionado] =
    useState(obterMesAtual);

  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("todas");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<
    number | null
  >(null);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    movimentacaoSelecionada,
    setMovimentacaoSelecionada,
  ] = useState<Movimentacao | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const textoTipo =
    tipo === "receita" ? "receita" : "despesa";

  const textoTipoPlural =
    tipo === "receita" ? "receitas" : "despesas";

  const titulo =
    tipo === "receita" ? "Receitas" : "Despesas";

  const subtitulo =
    tipo === "receita"
      ? "Acompanhe todas as entradas do seu orçamento."
      : "Controle seus gastos e mantenha o orçamento organizado.";

  const carregarMovimentacoes = useCallback(
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

        const {
          primeiroDia,
          primeiroDiaProximoMes,
        } = obterIntervaloDoMes(mesSelecionado);

        const { data, error } = await supabase
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
              created_at,
              updated_at,
              parcelamento_id,
              numero_parcela,
              total_parcelas,
              assinatura_id,
              competencia
            `
          )
          .eq("user_id", usuario.id)
          .eq("tipo", tipo)
          .gte("data", primeiroDia)
          .lt("data", primeiroDiaProximoMes)
          .order("data", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          });

        if (error) {
          throw error;
        }

        const registros = (data ?? []).map(
          (movimentacao) => ({
            ...movimentacao,
            valor: Number(movimentacao.valor),
          })
        ) as Movimentacao[];

        setMovimentacoes(registros);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : `Não foi possível carregar as ${textoTipoPlural}.`
        );
      } finally {
        setCarregando(false);
      }
    },
    [
      mesSelecionado,
      supabase,
      tipo,
      textoTipoPlural,
    ]
  );

  useEffect(() => {
    void carregarMovimentacoes();
  }, [carregarMovimentacoes]);

  useEffect(() => {
    setBusca("");
    setCategoriaSelecionada("todas");
    setMovimentacaoSelecionada(null);
    setModalAberto(false);
    setErro("");
    setSucesso("");
  }, [tipo]);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const temporizador = window.setTimeout(() => {
      setSucesso("");
    }, 4000);

    return () => {
      window.clearTimeout(temporizador);
    };
  }, [sucesso]);

  const movimentacoesFiltradas = useMemo(() => {
    const buscaNormalizada = busca
      .trim()
      .toLocaleLowerCase("pt-BR");

    return movimentacoes.filter((movimentacao) => {
      const correspondeCategoria =
        categoriaSelecionada === "todas" ||
        movimentacao.categoria ===
          categoriaSelecionada;

      if (!correspondeCategoria) {
        return false;
      }

      if (!buscaNormalizada) {
        return true;
      }

      const textoPesquisavel = [
        movimentacao.descricao,
        movimentacao.categoria,
        movimentacao.observacao ?? "",
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return textoPesquisavel.includes(
        buscaNormalizada
      );
    });
  }, [
    busca,
    categoriaSelecionada,
    movimentacoes,
  ]);

  const resumo = useMemo(() => {
    const valores = movimentacoes.map(
      (movimentacao) =>
        Number(movimentacao.valor) || 0
    );

    const total = valores.reduce(
      (acumulado, valor) => acumulado + valor,
      0
    );

    const media =
      valores.length > 0
        ? total / valores.length
        : 0;

    const maior =
      valores.length > 0
        ? Math.max(...valores)
        : 0;

    return {
      total,
      media,
      maior,
      quantidade: valores.length,
    };
  }, [movimentacoes]);

  function abrirNovoLancamento() {
    setMovimentacaoSelecionada(null);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(
    movimentacao: Movimentacao
  ) {
    setMovimentacaoSelecionada(movimentacao);
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setMovimentacaoSelecionada(null);
  }

 async function salvarMovimentacao(
  formulario: DadosFormularioMovimentacao
) {
    setSalvando(true);
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

      const dados =
        converterFormularioParaMovimentacao(
          formulario,
          tipo
        );

      if (
        !Number.isFinite(dados.valor) ||
        dados.valor <= 0
      ) {
        throw new Error(
          "Informe um valor válido maior que zero."
        );
      }

      if (movimentacaoSelecionada) {
        const { error } = await supabase
          .from("movimentacoes")
          .update({
            descricao: dados.descricao,
            categoria: dados.categoria,
            valor: dados.valor,
            data: dados.data,
            observacao: dados.observacao,
            competencia: dados.competencia,
            updated_at: new Date().toISOString(),
          })
          .eq("id", movimentacaoSelecionada.id)
          .eq("user_id", usuario.id)
          .eq("tipo", tipo);

        if (error) {
          throw error;
        }

        setSucesso(
          `${
            tipo === "receita"
              ? "Receita"
              : "Despesa"
          } atualizada com sucesso.`
        );
      } else {
        const { error } = await supabase
          .from("movimentacoes")
          .insert({
            user_id: usuario.id,
            tipo: dados.tipo,
            descricao: dados.descricao,
            categoria: dados.categoria,
            valor: dados.valor,
            data: dados.data,
            observacao: dados.observacao,
            competencia: dados.competencia,
          });

        if (error) {
          throw error;
        }

        setSucesso(
          `${
            tipo === "receita"
              ? "Receita"
              : "Despesa"
          } adicionada com sucesso.`
        );
      }

      setModalAberto(false);
      setMovimentacaoSelecionada(null);

      await carregarMovimentacoes(false);
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : `Não foi possível salvar a ${textoTipo}.`
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirMovimentacao(
    movimentacao: Movimentacao
  ) {
    const confirmou = window.confirm(
      `Deseja realmente excluir "${movimentacao.descricao}"?`
    );

    if (!confirmou) {
      return;
    }

    setExcluindoId(movimentacao.id);
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
        .from("movimentacoes")
        .delete()
        .eq("id", movimentacao.id)
        .eq("user_id", usuario.id)
        .eq("tipo", tipo);

      if (error) {
        throw error;
      }

      setMovimentacoes((estadoAtual) =>
        estadoAtual.filter(
          (item) => item.id !== movimentacao.id
        )
      );

      setSucesso(
        `${
          tipo === "receita"
            ? "Receita"
            : "Despesa"
        } excluída com sucesso.`
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : `Não foi possível excluir a ${textoTipo}.`
      );
    } finally {
      setExcluindoId(null);
    }
  }

  function limparFiltros() {
    setBusca("");
    setCategoriaSelecionada("todas");
  }

  const possuiFiltros =
    busca.trim() !== "" ||
    categoriaSelecionada !== "todas";

  const corDestaque =
    tipo === "receita"
      ? "text-emerald-400"
      : "text-red-400";

  const fundoDestaque =
    tipo === "receita"
      ? "border-emerald-900/70 bg-emerald-950/30"
      : "border-red-900/70 bg-red-950/30";

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p
              className={`text-sm font-semibold uppercase tracking-[0.2em] ${corDestaque}`}
            >
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {titulo}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
              {subtitulo}
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoLancamento}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50"
          >
            <span
              aria-hidden="true"
              className="text-lg"
            >
              +
            </span>

            Nova {textoTipo}
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
              onClick={() => setSucesso("")}
              aria-label="Fechar mensagem de sucesso"
              className="shrink-0 text-emerald-400 transition hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <CardResumoMovimentacao
            titulo={`${titulo} no mês`}
            valor={resumo.total}
            descricao={`${resumo.quantidade} ${
              resumo.quantidade === 1
                ? "lançamento"
                : "lançamentos"
            } em ${formatarMes(mesSelecionado)}`}
            icone={tipo === "receita" ? "↗" : "↘"}
            destaque={
              tipo === "receita"
                ? "positivo"
                : "negativo"
            }
          />

          <CardResumoMovimentacao
            titulo="Média por lançamento"
            valor={resumo.media}
            descricao={`Valor médio das ${textoTipoPlural} do período`}
            icone="÷"
            destaque="neutro"
          />

          <CardResumoMovimentacao
            titulo={`Maior ${textoTipo}`}
            valor={resumo.maior}
            descricao="Maior lançamento registrado no mês"
            icone="↑"
            destaque={
              tipo === "receita"
                ? "positivo"
                : "negativo"
            }
          />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_180px_auto]">
            <div>
              <label
                htmlFor={`busca-${tipo}`}
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Buscar
              </label>

              <input
                id={`busca-${tipo}`}
                type="search"
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder={`Buscar ${textoTipoPlural}...`}
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>

            <div>
              <label
                htmlFor={`categoria-${tipo}`}
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Categoria
              </label>

              <select
                id={`categoria-${tipo}`}
                value={categoriaSelecionada}
                onChange={(event) =>
                  setCategoriaSelecionada(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              >
                <option value="todas">
                  Todas as categorias
                </option>

                {categorias.map((categoria) => (
                  <option
                    key={categoria}
                    value={categoria}
                  >
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`mes-${tipo}`}
                className="mb-2 block text-sm font-medium text-zinc-400"
              >
                Mês
              </label>

              <input
                id={`mes-${tipo}`}
                type="month"
                value={mesSelecionado}
                onChange={(event) =>
                  setMesSelecionado(event.target.value)
                }
                className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-sm text-white outline-none transition [color-scheme:dark] focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
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
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                Lançamentos
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                {movimentacoesFiltradas.length}{" "}
                {movimentacoesFiltradas.length === 1
                  ? "resultado encontrado"
                  : "resultados encontrados"}
              </p>
            </div>

            <div
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-medium ${fundoDestaque} ${corDestaque}`}
            >
              {formatarMes(mesSelecionado)}
            </div>
          </div>

          <ListaMovimentacoes
            movimentacoes={movimentacoesFiltradas}
            tipo={tipo}
            carregando={carregando}
            excluindoId={excluindoId}
            onEditar={abrirEdicao}
            onExcluir={excluirMovimentacao}
          />
        </section>
      </div>

      <ModalMovimentacao
        aberto={modalAberto}
        titulo={
          movimentacaoSelecionada
            ? `Editar ${textoTipo}`
            : `Nova ${textoTipo}`
        }
        onFechar={fecharModal}
      >
        <FormularioMovimentacao
          tipo={tipo}
          movimentacao={movimentacaoSelecionada}
          carregando={salvando}
          onSalvar={salvarMovimentacao}
          onCancelar={fecharModal}
        />
      </ModalMovimentacao>
    </main>
  );
}