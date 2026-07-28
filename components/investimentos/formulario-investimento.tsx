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
  FORMULARIO_INVESTIMENTO_INICIAL,
  TIPOS_INVESTIMENTOS,
  calcularRentabilidadeInvestimento,
  calcularResultadoInvestimento,
  converterFormularioParaInvestimento,
  converterValorMonetario,
} from "@/types/investimento";

import type {
  FormularioInvestimento as DadosFormularioInvestimento,
  Investimento,
} from "@/types/investimento";

type FormularioInvestimentoProps = {
  investimento?: Investimento | null;
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

function formatarPercentual(valor: number) {
  const valorSeguro = Number.isFinite(valor)
    ? valor
    : 0;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorSeguro);
}

function converterInvestimentoParaFormulario(
  investimento: Investimento
): DadosFormularioInvestimento {
  return {
    nome: investimento.nome,
    tipo: investimento.tipo,
    instituicao:
      investimento.instituicao ?? "",
    valorAplicado: Number(
      investimento.valor_aplicado
    )
      .toFixed(2)
      .replace(".", ","),
    valorAtual: Number(
      investimento.valor_atual
    )
      .toFixed(2)
      .replace(".", ","),
    dataAplicacao:
      investimento.data_aplicacao,
    observacao:
      investimento.observacao ?? "",
  };
}

export default function FormularioInvestimento({
  investimento = null,
  carregandoExterno = false,
  onConcluido,
  onCancelar,
}: FormularioInvestimentoProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [formulario, setFormulario] =
    useState<DadosFormularioInvestimento>({
      ...FORMULARIO_INVESTIMENTO_INICIAL,
    });

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] =
    useState("");

  const modoEdicao = Boolean(investimento);

  const bloqueado =
    carregando || carregandoExterno;

  const valorAplicado = useMemo(
    () =>
      converterValorMonetario(
        formulario.valorAplicado
      ),
    [formulario.valorAplicado]
  );

  const valorAtual = useMemo(() => {
    if (!formulario.valorAtual.trim()) {
      return valorAplicado;
    }

    return converterValorMonetario(
      formulario.valorAtual
    );
  }, [
    formulario.valorAtual,
    valorAplicado,
  ]);

  const resultado = useMemo(
    () =>
      calcularResultadoInvestimento({
        valor_aplicado: valorAplicado,
        valor_atual: valorAtual,
      }),
    [valorAplicado, valorAtual]
  );

  const rentabilidade = useMemo(
    () =>
      calcularRentabilidadeInvestimento({
        valor_aplicado: valorAplicado,
        valor_atual: valorAtual,
      }),
    [valorAplicado, valorAtual]
  );

  useEffect(() => {
    if (investimento) {
      setFormulario(
        converterInvestimentoParaFormulario(
          investimento
        )
      );

      setErro("");
      setSucesso("");

      return;
    }

    setFormulario({
      ...FORMULARIO_INVESTIMENTO_INICIAL,
    });

    setErro("");
    setSucesso("");
  }, [investimento]);

  function atualizarCampo(
    campo: keyof DadosFormularioInvestimento,
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
      return "Informe o nome do investimento.";
    }

    if (!formulario.tipo) {
      return "Selecione o tipo do investimento.";
    }

    if (
      !Number.isFinite(valorAplicado) ||
      valorAplicado <= 0
    ) {
      return "Informe um valor aplicado válido.";
    }

    if (
      !Number.isFinite(valorAtual) ||
      valorAtual < 0
    ) {
      return "Informe um valor atual válido.";
    }

    if (!formulario.dataAplicacao) {
      return "Informe a data da aplicação.";
    }

    return "";
  }

  function limparFormulario() {
    setFormulario({
      ...FORMULARIO_INVESTIMENTO_INICIAL,
    });
  }

  async function salvarInvestimento(
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

      const dadosInvestimento =
        converterFormularioParaInvestimento(
          formulario
        );

      if (investimento) {
        const { error } = await supabase
          .from("investimentos")
          .update({
            nome: dadosInvestimento.nome,
            tipo: dadosInvestimento.tipo,
            instituicao:
              dadosInvestimento.instituicao,
            valor_aplicado:
              dadosInvestimento.valor_aplicado,
            valor_atual:
              dadosInvestimento.valor_atual,
            data_aplicacao:
              dadosInvestimento.data_aplicacao,
            observacao:
              dadosInvestimento.observacao,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", investimento.id)
          .eq("user_id", usuario.id);

        if (error) {
          throw error;
        }

        setSucesso(
          "Investimento atualizado com sucesso."
        );
      } else {
        const { error } = await supabase
          .from("investimentos")
          .insert({
            user_id: usuario.id,
            ...dadosInvestimento,
          });

        if (error) {
          throw error;
        }

        limparFormulario();

        setSucesso(
          "Investimento cadastrado com sucesso."
        );
      }

      await onConcluido?.();
    } catch (error) {
      console.error(
        "Erro ao salvar investimento:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o investimento."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={salvarInvestimento}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">
          {modoEdicao
            ? "Editar investimento"
            : "Novo investimento"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {modoEdicao
            ? "Atualize os dados e o valor atual do investimento."
            : "Cadastre uma aplicação e acompanhe seu resultado."}
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
          htmlFor="nome-investimento"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Nome do investimento
        </label>

        <input
          id="nome-investimento"
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
          placeholder="Ex.: Reserva de emergência"
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="tipo-investimento"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Tipo
          </label>

          <select
            id="tipo-investimento"
            value={formulario.tipo}
            onChange={(event) =>
              atualizarCampo(
                "tipo",
                event.target.value
              )
            }
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              Selecione o tipo
            </option>

            {TIPOS_INVESTIMENTOS.map(
              (tipo) => (
                <option
                  key={tipo}
                  value={tipo}
                >
                  {tipo}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="instituicao-investimento"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Instituição
            <span className="ml-1 text-zinc-600">
              (opcional)
            </span>
          </label>

          <input
            id="instituicao-investimento"
            type="text"
            autoComplete="off"
            maxLength={120}
            value={formulario.instituicao}
            onChange={(event) =>
              atualizarCampo(
                "instituicao",
                event.target.value
              )
            }
            placeholder="Ex.: Nubank"
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="valor-aplicado-investimento"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor aplicado
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500">
              R$
            </span>

            <input
              id="valor-aplicado-investimento"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={formulario.valorAplicado}
              onChange={(event) =>
                atualizarCampo(
                  "valorAplicado",
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
            htmlFor="valor-atual-investimento"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor atual
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500">
              R$
            </span>

            <input
              id="valor-atual-investimento"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={formulario.valorAtual}
              onChange={(event) =>
                atualizarCampo(
                  "valorAtual",
                  event.target.value
                )
              }
              placeholder={
                formulario.valorAplicado ||
                "Mesmo valor aplicado"
              }
              disabled={bloqueado}
              className="w-full rounded-xl border border-zinc-800 bg-black py-3 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      <CampoData
        id="data-aplicacao-investimento"
        label="Data da aplicação"
        value={formulario.dataAplicacao}
        onChange={(valor) =>
          atualizarCampo(
            "dataAplicacao",
            valor
          )
        }
        required
        descricao="Data em que o investimento foi realizado."
      />

      <div>
        <label
          htmlFor="observacao-investimento"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Observação
          <span className="ml-1 text-zinc-600">
            (opcional)
          </span>
        </label>

        <textarea
          id="observacao-investimento"
          rows={4}
          maxLength={500}
          value={formulario.observacao}
          onChange={(event) =>
            atualizarCampo(
              "observacao",
              event.target.value
            )
          }
          placeholder="Ex.: Vencimento em dezembro de 2028."
          disabled={bloqueado}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {valorAplicado > 0 && (
        <div className="rounded-2xl border border-zinc-800 bg-black p-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-500">
                Valor aplicado
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {formatarMoeda(valorAplicado)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Resultado
              </p>

              <p
                className={`mt-2 text-lg font-bold ${
                  resultado > 0
                    ? "text-emerald-400"
                    : resultado < 0
                      ? "text-red-400"
                      : "text-zinc-300"
                }`}
              >
                {resultado > 0 ? "+" : ""}
                {formatarMoeda(resultado)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Rentabilidade
              </p>

              <p
                className={`mt-2 text-lg font-bold ${
                  rentabilidade > 0
                    ? "text-emerald-400"
                    : rentabilidade < 0
                      ? "text-red-400"
                      : "text-zinc-300"
                }`}
              >
                {rentabilidade > 0 ? "+" : ""}
                {formatarPercentual(
                  rentabilidade
                )}
                %
              </p>
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
            ? "Salvando..."
            : modoEdicao
              ? "Salvar alterações"
              : "Salvar investimento"}
        </button>
      </div>
    </form>
  );
}