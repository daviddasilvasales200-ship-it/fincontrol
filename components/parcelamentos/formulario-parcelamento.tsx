"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import CampoData from "@/components/campo-data";
import { createClient } from "@/lib/supabase/client";

import {
  CATEGORIAS_PARCELAMENTOS,
  FORMULARIO_PARCELAMENTO_INICIAL,
  QUANTIDADES_PARCELAS,
  calcularValorParcela,
  converterFormularioParaParcelamento,
  converterValorMonetario,
  gerarParcelasMovimentacoes,
} from "@/types/parcelamento";

import type {
  FormularioParcelamento as DadosFormularioParcelamento,
} from "@/types/parcelamento";

type FormularioParcelamentoProps = {
  carregandoExterno?: boolean;
  onConcluido?: () => Promise<void> | void;
  onCancelar?: () => void;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

export default function FormularioParcelamento({
  carregandoExterno = false,
  onConcluido,
  onCancelar,
}: FormularioParcelamentoProps) {
  const supabase = useMemo(() => createClient(), []);

  const [formulario, setFormulario] =
    useState<DadosFormularioParcelamento>({
      ...FORMULARIO_PARCELAMENTO_INICIAL,
    });

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const bloqueado =
    carregando || carregandoExterno;

  const valorTotalConvertido = useMemo(
    () =>
      converterValorMonetario(
        formulario.valorTotal
      ),
    [formulario.valorTotal]
  );

  const quantidadeParcelasConvertida = useMemo(
    () => Number(formulario.quantidadeParcelas),
    [formulario.quantidadeParcelas]
  );

  const valorParcela = useMemo(
    () =>
      calcularValorParcela(
        valorTotalConvertido,
        quantidadeParcelasConvertida
      ),
    [
      quantidadeParcelasConvertida,
      valorTotalConvertido,
    ]
  );

  function atualizarCampo(
    campo: keyof DadosFormularioParcelamento,
    valor: string
  ) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));

    if (erro) {
      setErro("");
    }

    if (sucesso) {
      setSucesso("");
    }
  }

  function validarFormulario() {
    if (!formulario.descricao.trim()) {
      return "Informe uma descrição.";
    }

    if (!formulario.categoria) {
      return "Selecione uma categoria.";
    }

    if (
      !Number.isFinite(valorTotalConvertido) ||
      valorTotalConvertido <= 0
    ) {
      return "Informe um valor total válido.";
    }

    if (
      !Number.isInteger(
        quantidadeParcelasConvertida
      ) ||
      quantidadeParcelasConvertida < 2 ||
      quantidadeParcelasConvertida > 120
    ) {
      return "Escolha entre 2 e 120 parcelas.";
    }

    if (!formulario.dataPrimeiraParcela) {
      return "Informe a data da primeira parcela.";
    }

    return "";
  }

  function limparFormulario() {
    setFormulario({
      ...FORMULARIO_PARCELAMENTO_INICIAL,
    });
  }

  async function salvarParcelamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const mensagemValidacao =
      validarFormulario();

    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");

    let parcelamentoCriadoId: number | null =
      null;

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

      const dadosParcelamento =
        converterFormularioParaParcelamento(
          formulario
        );

      const {
        data: parcelamentoCriado,
        error: parcelamentoError,
      } = await supabase
        .from("parcelamentos")
        .insert({
          user_id: usuario.id,
          ...dadosParcelamento,
          ativo: true,
        })
        .select("id")
        .single();

      if (parcelamentoError) {
        throw parcelamentoError;
      }

      if (!parcelamentoCriado?.id) {
        throw new Error(
          "O parcelamento foi salvo, mas seu identificador não foi retornado."
        );
      }

      parcelamentoCriadoId =
        Number(parcelamentoCriado.id);

      const parcelas =
        gerarParcelasMovimentacoes({
          userId: usuario.id,
          parcelamentoId:
            parcelamentoCriadoId,
          parcelamento: dadosParcelamento,
        });

      const { error: parcelasError } =
        await supabase
          .from("movimentacoes")
          .insert(parcelas);

      if (parcelasError) {
        /*
         * A criação das parcelas falhou.
         * Tentamos remover o registro principal para
         * evitar um parcelamento sem movimentações.
         */
        await supabase
          .from("parcelamentos")
          .delete()
          .eq("id", parcelamentoCriadoId)
          .eq("user_id", usuario.id);

        parcelamentoCriadoId = null;

        throw parcelasError;
      }

      limparFormulario();

      setSucesso(
        `Parcelamento criado com ${dadosParcelamento.quantidade_parcelas} parcelas.`
      );

      await onConcluido?.();
    } catch (error) {
      console.error(
        "Erro ao criar parcelamento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o parcelamento."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={salvarParcelamento}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">
          Novo parcelamento
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          Cadastre uma compra parcelada e gere
          automaticamente todas as despesas mensais.
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

      {sucesso && (
        <div
          role="status"
          className="rounded-xl border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
        >
          {sucesso}
        </div>
      )}

      <div>
        <label
          htmlFor="descricao-parcelamento"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Descrição
        </label>

        <input
          id="descricao-parcelamento"
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
          placeholder="Ex.: Notebook"
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="valor-total-parcelamento"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor total
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500">
              R$
            </span>

            <input
              id="valor-total-parcelamento"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={formulario.valorTotal}
              onChange={(event) =>
                atualizarCampo(
                  "valorTotal",
                  event.target.value
                )
              }
              placeholder="0,00"
              disabled={bloqueado}
              className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="quantidade-parcelas"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Quantidade de parcelas
          </label>

          <select
            id="quantidade-parcelas"
            value={formulario.quantidadeParcelas}
            onChange={(event) =>
              atualizarCampo(
                "quantidadeParcelas",
                event.target.value
              )
            }
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {QUANTIDADES_PARCELAS.map(
              (quantidade) => (
                <option
                  key={quantidade}
                  value={quantidade}
                >
                  {quantidade}x
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="categoria-parcelamento"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Categoria
        </label>

        <select
          id="categoria-parcelamento"
          value={formulario.categoria}
          onChange={(event) =>
            atualizarCampo(
              "categoria",
              event.target.value
            )
          }
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">
            Selecione uma categoria
          </option>

          {CATEGORIAS_PARCELAMENTOS.map(
            (categoria) => (
              <option
                key={categoria}
                value={categoria}
              >
                {categoria}
              </option>
            )
          )}
        </select>
      </div>

      <CampoData
        id="data-primeira-parcela"
        label="Data da primeira parcela"
        value={formulario.dataPrimeiraParcela}
        onChange={(valor) =>
          atualizarCampo(
            "dataPrimeiraParcela",
            valor
          )
        }
        required
        descricao="As próximas parcelas serão lançadas mensalmente a partir desta data."
      />

      <div>
        <label
          htmlFor="observacao-parcelamento"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Observação
          <span className="ml-1 text-zinc-600">
            (opcional)
          </span>
        </label>

        <textarea
          id="observacao-parcelamento"
          rows={4}
          maxLength={500}
          value={formulario.observacao}
          onChange={(event) =>
            atualizarCampo(
              "observacao",
              event.target.value
            )
          }
          placeholder="Adicione informações importantes sobre esta compra."
          disabled={bloqueado}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {valorParcela > 0 && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-zinc-400">
                Valor aproximado por parcela
              </p>

              <p className="mt-2 text-2xl font-bold text-red-400">
                {formatarMoeda(valorParcela)}
              </p>

              <p className="mt-2 text-xs leading-5 text-zinc-600">
                A última parcela poderá receber um
                pequeno ajuste de centavos.
              </p>
            </div>

            <div className="rounded-xl border border-red-900/70 bg-red-950/40 px-3 py-2 text-sm font-bold text-red-400">
              {quantidadeParcelasConvertida}x
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={bloqueado}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={bloqueado}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {bloqueado
            ? "Criando parcelas..."
            : "Salvar parcelamento"}
        </button>
      </div>
    </form>
  );
}