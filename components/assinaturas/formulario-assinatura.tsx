"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import CampoData from "@/components/campo-data";
import { createClient } from "@/lib/supabase/client";

import {
  CATEGORIAS_ASSINATURAS,
  FORMULARIO_ASSINATURA_INICIAL,
  converterFormularioParaAssinatura,
  converterValorMonetario,
} from "@/types/assinatura";

import type {
  Assinatura,
  FormularioAssinatura as DadosFormularioAssinatura,
} from "@/types/assinatura";

type FormularioAssinaturaProps = {
  assinatura?: Assinatura | null;
  carregandoExterno?: boolean;
  onConcluido?: () => Promise<void> | void;
  onCancelar?: () => void;
};

function formatarMoeda(valor: number) {
  const valorSeguro = Number.isFinite(valor)
    ? valor
    : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorSeguro);
}

function converterAssinaturaParaFormulario(
  assinatura: Assinatura
): DadosFormularioAssinatura {
  return {
    nome: assinatura.nome,
    categoria: assinatura.categoria,
    valor: Number(assinatura.valor)
      .toFixed(2)
      .replace(".", ","),
    diaVencimento: String(
      assinatura.dia_vencimento
    ),
    dataInicio: assinatura.data_inicio,
    observacao: assinatura.observacao ?? "",
  };
}

export default function FormularioAssinatura({
  assinatura = null,
  carregandoExterno = false,
  onConcluido,
  onCancelar,
}: FormularioAssinaturaProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [formulario, setFormulario] =
    useState<DadosFormularioAssinatura>({
      ...FORMULARIO_ASSINATURA_INICIAL,
    });

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] =
    useState("");

  const modoEdicao = Boolean(assinatura);

  const bloqueado =
    carregando || carregandoExterno;

  const valorConvertido = useMemo(
    () =>
      converterValorMonetario(
        formulario.valor
      ),
    [formulario.valor]
  );

  const custoAnual = useMemo(
    () => valorConvertido * 12,
    [valorConvertido]
  );

  useEffect(() => {
    if (assinatura) {
      setFormulario(
        converterAssinaturaParaFormulario(
          assinatura
        )
      );

      setErro("");
      setSucesso("");

      return;
    }

    setFormulario({
      ...FORMULARIO_ASSINATURA_INICIAL,
    });

    setErro("");
    setSucesso("");
  }, [assinatura]);

  function atualizarCampo(
    campo: keyof DadosFormularioAssinatura,
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
    if (!formulario.nome.trim()) {
      return "Informe o nome da assinatura.";
    }

    if (!formulario.categoria) {
      return "Selecione uma categoria.";
    }

    if (
      !Number.isFinite(valorConvertido) ||
      valorConvertido <= 0
    ) {
      return "Informe um valor mensal válido.";
    }

    const diaVencimento = Number(
      formulario.diaVencimento
    );

    if (
      !Number.isInteger(diaVencimento) ||
      diaVencimento < 1 ||
      diaVencimento > 31
    ) {
      return "Informe um dia de vencimento entre 1 e 31.";
    }

    if (!formulario.dataInicio) {
      return "Informe a data de início.";
    }

    return "";
  }

  function limparFormulario() {
    setFormulario({
      ...FORMULARIO_ASSINATURA_INICIAL,
    });
  }

  async function salvarAssinatura(
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

      const dadosAssinatura =
        converterFormularioParaAssinatura(
          formulario
        );

      if (assinatura) {
        const { error } = await supabase
          .from("assinaturas")
          .update({
            nome: dadosAssinatura.nome,
            categoria:
              dadosAssinatura.categoria,
            valor: dadosAssinatura.valor,
            dia_vencimento:
              dadosAssinatura.dia_vencimento,
            data_inicio:
              dadosAssinatura.data_inicio,
            observacao:
              dadosAssinatura.observacao,
          })
          .eq("id", assinatura.id)
          .eq("user_id", usuario.id);

        if (error) {
          throw error;
        }

        setSucesso(
          "Assinatura atualizada com sucesso."
        );
      } else {
        const { error } = await supabase
          .from("assinaturas")
          .insert({
            user_id: usuario.id,
            ...dadosAssinatura,
          });

        if (error) {
          throw error;
        }

        limparFormulario();

        setSucesso(
          "Assinatura cadastrada com sucesso."
        );
      }

      await onConcluido?.();
    } catch (error) {
      console.error(
        "Erro ao salvar assinatura:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a assinatura."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={salvarAssinatura}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">
          {modoEdicao
            ? "Editar assinatura"
            : "Nova assinatura"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {modoEdicao
            ? "Atualize os dados do serviço recorrente."
            : "Cadastre serviços e pagamentos recorrentes mensais."}
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
          htmlFor="nome-assinatura"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Nome da assinatura
        </label>

        <input
          id="nome-assinatura"
          type="text"
          autoComplete="off"
          maxLength={120}
          value={formulario.nome}
          onChange={(event) =>
            atualizarCampo(
              "nome",
              event.target.value
            )
          }
          placeholder="Ex.: Netflix"
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="valor-assinatura"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor mensal
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500">
              R$
            </span>

            <input
              id="valor-assinatura"
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
              disabled={bloqueado}
              className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="dia-vencimento-assinatura"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Dia do vencimento
          </label>

          <select
            id="dia-vencimento-assinatura"
            value={formulario.diaVencimento}
            onChange={(event) =>
              atualizarCampo(
                "diaVencimento",
                event.target.value
              )
            }
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {Array.from(
              { length: 31 },
              (_, indice) => indice + 1
            ).map((dia) => (
              <option
                key={dia}
                value={dia}
              >
                Dia {dia}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="categoria-assinatura"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Categoria
        </label>

        <select
          id="categoria-assinatura"
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

          {CATEGORIAS_ASSINATURAS.map(
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
        id="data-inicio-assinatura"
        label="Data de início"
        value={formulario.dataInicio}
        onChange={(valor) =>
          atualizarCampo(
            "dataInicio",
            valor
          )
        }
        required
        descricao="Data em que a assinatura começou ou começará a ser cobrada."
      />

      <div>
        <label
          htmlFor="observacao-assinatura"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Observação
          <span className="ml-1 text-zinc-600">
            (opcional)
          </span>
        </label>

        <textarea
          id="observacao-assinatura"
          rows={4}
          maxLength={500}
          value={formulario.observacao}
          onChange={(event) =>
            atualizarCampo(
              "observacao",
              event.target.value
            )
          }
          placeholder="Ex.: Plano premium, compartilhado com a família."
          disabled={bloqueado}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {valorConvertido > 0 && (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-zinc-400">
                Custo mensal
              </p>

              <p className="mt-2 text-2xl font-bold text-red-400">
                {formatarMoeda(
                  valorConvertido
                )}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-sm text-zinc-400">
                Estimativa anual
              </p>

              <p className="mt-2 text-xl font-bold text-white">
                {formatarMoeda(custoAnual)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-600">
            Estimativa baseada em 12 cobranças
            mensais no mesmo valor.
          </p>
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
            ? "Salvando..."
            : modoEdicao
              ? "Salvar alterações"
              : "Salvar assinatura"}
        </button>
      </div>
    </form>
  );
}