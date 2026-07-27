"use client";

"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FORMULARIO_MOVIMENTACAO_INICIAL,
  obterCategoriasPorTipo,
} from "@/types/movimentacao";

import type {
  FormularioMovimentacao,
  Movimentacao,
  TipoMovimentacao,
} from "@/types/movimentacao";

type FormularioMovimentacaoProps = {
  tipo: TipoMovimentacao;
  movimentacao?: Movimentacao | null;
  carregando?: boolean;
  onSalvar: (dados: FormularioMovimentacao) => Promise<void> | void;
  onCancelar?: () => void;
};

function formatarValorParaFormulario(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}

export default function FormularioMovimentacao({
  tipo,
  movimentacao,
  carregando = false,
  onSalvar,
  onCancelar,
}: FormularioMovimentacaoProps) {
  const categorias = useMemo(
    () => obterCategoriasPorTipo(tipo),
    [tipo]
  );

  const [formulario, setFormulario] =
    useState<FormularioMovimentacao>(
      FORMULARIO_MOVIMENTACAO_INICIAL
    );

  const [erro, setErro] = useState("");

  const editando = Boolean(movimentacao);

  useEffect(() => {
    if (!movimentacao) {
      setFormulario({
        ...FORMULARIO_MOVIMENTACAO_INICIAL,
        categoria: categorias[0] ?? "",
      });

      setErro("");
      return;
    }

    setFormulario({
      descricao: movimentacao.descricao,
      categoria: movimentacao.categoria,
      valor: formatarValorParaFormulario(
        Number(movimentacao.valor)
      ),
      data: movimentacao.data,
      observacao: movimentacao.observacao ?? "",
    });

    setErro("");
  }, [movimentacao, categorias]);

  function atualizarCampo(
    campo: keyof FormularioMovimentacao,
    valor: string
  ) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));

    if (erro) {
      setErro("");
    }
  }

  function validarFormulario() {
    if (!formulario.descricao.trim()) {
      return "Informe uma descrição.";
    }

    if (!formulario.categoria) {
      return "Selecione uma categoria.";
    }

    if (!formulario.valor.trim()) {
      return "Informe o valor.";
    }

    const valorConvertido = Number(
      formulario.valor
        .replace(/\./g, "")
        .replace(",", ".")
    );

    if (
      Number.isNaN(valorConvertido) ||
      valorConvertido <= 0
    ) {
      return "Informe um valor maior que zero.";
    }

    if (!formulario.data) {
      return "Informe a data.";
    }

    return "";
  }

  async function enviarFormulario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const mensagemErro = validarFormulario();

    if (mensagemErro) {
      setErro(mensagemErro);
      return;
    }

    try {
      await onSalvar(formulario);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a movimentação."
      );
    }
  }

  const titulo =
    tipo === "receita"
      ? editando
        ? "Editar receita"
        : "Nova receita"
      : editando
        ? "Editar despesa"
        : "Nova despesa";

  const textoBotao =
    tipo === "receita"
      ? editando
        ? "Salvar receita"
        : "Adicionar receita"
      : editando
        ? "Salvar despesa"
        : "Adicionar despesa";

  return (
    <form
      onSubmit={enviarFormulario}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">
          {titulo}
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Preencha os dados abaixo para registrar sua{" "}
          {tipo}.
        </p>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {erro}
        </div>
      )}

      <div>
        <label
          htmlFor="descricao"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Descrição
        </label>

        <input
          id="descricao"
          name="descricao"
          type="text"
          autoComplete="off"
          maxLength={120}
          value={formulario.descricao}
          onChange={(event) =>
            atualizarCampo(
              "descricao",
              event.target.value
            )
          }
          placeholder={
            tipo === "receita"
              ? "Ex.: Salário do mês"
              : "Ex.: Compra no supermercado"
          }
          disabled={carregando}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="categoria"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Categoria
          </label>

          <select
            id="categoria"
            name="categoria"
            value={formulario.categoria}
            onChange={(event) =>
              atualizarCampo(
                "categoria",
                event.target.value
              )
            }
            disabled={carregando}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
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
            htmlFor="valor"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500">
              R$
            </span>

            <input
              id="valor"
              name="valor"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={formulario.valor}
              onChange={(event) =>
                atualizarCampo(
                  "valor",
                  event.target.value
                )
              }
              placeholder="0,00"
              disabled={carregando}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="data"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Data
        </label>

        <input
          id="data"
          name="data"
          type="date"
          value={formulario.data}
          onChange={(event) =>
            atualizarCampo("data", event.target.value)
          }
          disabled={carregando}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition [color-scheme:dark] focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="observacao"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Observação
          <span className="ml-1 text-zinc-600">
            (opcional)
          </span>
        </label>

        <textarea
          id="observacao"
          name="observacao"
          rows={4}
          maxLength={500}
          value={formulario.observacao}
          onChange={(event) =>
            atualizarCampo(
              "observacao",
              event.target.value
            )
          }
          placeholder="Adicione alguma informação importante sobre este lançamento."
          disabled={carregando}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? "Salvando..." : textoBotao}
        </button>
      </div>
    </form>
  );
}