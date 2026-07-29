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
  COMPETICOES_APOSTAS,
  FORMULARIO_APOSTA_INICIAL,
  MODALIDADES_APOSTAS,
  calcularLucroPrejuizo,
  calcularRetornoPotencial,
  converterFormularioParaAposta,
  converterOdd,
  converterValorMonetario,
} from "@/types/aposta";

import type {
  Aposta,
  FormularioAposta as DadosFormularioAposta,
  ResultadoAposta,
} from "@/types/aposta";

type FormularioApostaProps = {
  aposta?: Aposta | null;
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

function formatarOdd(valor: number) {
  const valorSeguro = Number.isFinite(valor)
    ? valor
    : 0;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorSeguro);
}

function converterApostaParaFormulario(
  aposta: Aposta
): DadosFormularioAposta {
  return {
    descricao: aposta.descricao,
    modalidade: aposta.modalidade,
    competicao: aposta.competicao ?? "",
    timeCasa: aposta.time_casa ?? "",
    timeVisitante:
      aposta.time_visitante ?? "",
    casaAposta: aposta.casa_aposta ?? "",
    valorApostado: Number(
      aposta.valor_apostado
    )
      .toFixed(2)
      .replace(".", ","),
    odd: Number(aposta.odd)
      .toFixed(2)
      .replace(".", ","),
    resultado: aposta.resultado,
    dataAposta: aposta.data_aposta,
    observacao: aposta.observacao ?? "",
  };
}

const OPCOES_RESULTADO: {
  valor: ResultadoAposta;
  texto: string;
}[] = [
  {
    valor: "pendente",
    texto: "Pendente",
  },
  {
    valor: "ganha",
    texto: "Ganha",
  },
  {
    valor: "perdida",
    texto: "Perdida",
  },
  {
    valor: "anulada",
    texto: "Anulada",
  },
];

export default function FormularioAposta({
  aposta = null,
  carregandoExterno = false,
  onConcluido,
  onCancelar,
}: FormularioApostaProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [formulario, setFormulario] =
    useState<DadosFormularioAposta>({
      ...FORMULARIO_APOSTA_INICIAL,
    });

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] =
    useState("");

  const modoEdicao = Boolean(aposta);

  const bloqueado =
    carregando || carregandoExterno;

  const valorApostado = useMemo(
    () =>
      converterValorMonetario(
        formulario.valorApostado
      ),
    [formulario.valorApostado]
  );

  const odd = useMemo(
    () => converterOdd(formulario.odd),
    [formulario.odd]
  );

  const retornoPotencial = useMemo(
    () =>
      calcularRetornoPotencial(
        valorApostado,
        odd
      ),
    [odd, valorApostado]
  );

  const lucroPrejuizo = useMemo(
    () =>
      calcularLucroPrejuizo(
        valorApostado,
        retornoPotencial,
        formulario.resultado
      ),
    [
      formulario.resultado,
      retornoPotencial,
      valorApostado,
    ]
  );

  useEffect(() => {
    if (aposta) {
      setFormulario(
        converterApostaParaFormulario(
          aposta
        )
      );

      setErro("");
      setSucesso("");

      return;
    }

    setFormulario({
      ...FORMULARIO_APOSTA_INICIAL,
    });

    setErro("");
    setSucesso("");
  }, [aposta]);

  function atualizarCampo(
    campo: keyof DadosFormularioAposta,
    valor: string
  ) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));

    setErro("");
    setSucesso("");
  }

  function atualizarResultado(
    resultado: ResultadoAposta
  ) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      resultado,
    }));

    setErro("");
    setSucesso("");
  }

  function validarFormulario() {
    if (!formulario.descricao.trim()) {
      return "Informe a descrição da aposta.";
    }

    if (!formulario.modalidade) {
      return "Selecione a modalidade.";
    }

    if (!formulario.competicao.trim()) {
      return "Informe ou selecione a competição.";
    }

    if (!formulario.timeCasa.trim()) {
      return "Informe o primeiro time do confronto.";
    }

    if (!formulario.timeVisitante.trim()) {
      return "Informe o segundo time do confronto.";
    }

    if (
      formulario.timeCasa
        .trim()
        .toLocaleLowerCase("pt-BR") ===
      formulario.timeVisitante
        .trim()
        .toLocaleLowerCase("pt-BR")
    ) {
      return "Os times do confronto devem ser diferentes.";
    }

    if (
      !Number.isFinite(valorApostado) ||
      valorApostado <= 0
    ) {
      return "Informe um valor apostado válido.";
    }

    if (
      !Number.isFinite(odd) ||
      odd < 1
    ) {
      return "Informe uma odd válida, igual ou superior a 1,00.";
    }

    if (!formulario.dataAposta) {
      return "Informe a data da aposta.";
    }

    return "";
  }

  function limparFormulario() {
    setFormulario({
      ...FORMULARIO_APOSTA_INICIAL,
    });
  }

  async function salvarAposta(
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

      const dadosAposta =
        converterFormularioParaAposta(
          formulario
        );

      if (aposta) {
        const { error } = await supabase
          .from("apostas")
          .update({
            descricao:
              dadosAposta.descricao,
            modalidade:
              dadosAposta.modalidade,
            competicao:
              dadosAposta.competicao,
            time_casa:
              dadosAposta.time_casa,
            time_visitante:
              dadosAposta.time_visitante,
            casa_aposta:
              dadosAposta.casa_aposta,
            valor_apostado:
              dadosAposta.valor_apostado,
            odd: dadosAposta.odd,
            retorno_potencial:
              dadosAposta.retorno_potencial,
            resultado:
              dadosAposta.resultado,
            lucro_prejuizo:
              dadosAposta.lucro_prejuizo,
            data_aposta:
              dadosAposta.data_aposta,
            observacao:
              dadosAposta.observacao,
            updated_at:
              new Date().toISOString(),
          })
          .eq("id", aposta.id)
          .eq("user_id", usuario.id);

        if (error) {
          throw error;
        }

        setSucesso(
          "Aposta atualizada com sucesso."
        );
      } else {
        const { error } = await supabase
          .from("apostas")
          .insert({
            user_id: usuario.id,
            ...dadosAposta,
          });

        if (error) {
          throw error;
        }

        limparFormulario();

        setSucesso(
          "Aposta cadastrada com sucesso."
        );
      }

      await onConcluido?.();
    } catch (error) {
      console.error(
        "Erro ao salvar aposta:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a aposta."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={salvarAposta}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">
          {modoEdicao
            ? "Editar aposta"
            : "Nova aposta"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {modoEdicao
            ? "Atualize o confronto, os dados e o resultado da aposta."
            : "Registre o confronto e acompanhe seu desempenho."}
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
          htmlFor="descricao-aposta"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Descrição da aposta
        </label>

        <input
          id="descricao-aposta"
          type="text"
          autoComplete="off"
          maxLength={160}
          value={formulario.descricao}
          onChange={(event) =>
            atualizarCampo(
              "descricao",
              event.target.value
            )
          }
          placeholder="Ex.: Flamengo vence o jogo"
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="modalidade-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Modalidade
          </label>

          <select
            id="modalidade-aposta"
            value={formulario.modalidade}
            onChange={(event) =>
              atualizarCampo(
                "modalidade",
                event.target.value
              )
            }
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              Selecione a modalidade
            </option>

            {MODALIDADES_APOSTAS.map(
              (modalidade) => (
                <option
                  key={modalidade}
                  value={modalidade}
                >
                  {modalidade}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="competicao-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Competição
          </label>

          <input
            id="competicao-aposta"
            type="text"
            list="lista-competicoes-apostas"
            autoComplete="off"
            maxLength={120}
            value={formulario.competicao}
            onChange={(event) =>
              atualizarCampo(
                "competicao",
                event.target.value
              )
            }
            placeholder="Ex.: Brasileirão Série A"
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          />

          <datalist id="lista-competicoes-apostas">
            {COMPETICOES_APOSTAS.map(
              (competicao) => (
                <option
                  key={competicao}
                  value={competicao}
                />
              )
            )}
          </datalist>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-black/60 p-4">
        <p className="text-sm font-semibold text-white">
          Confronto
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          Informe os dois participantes da partida.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <div>
            <label
              htmlFor="time-casa-aposta"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Primeiro time
            </label>

            <input
              id="time-casa-aposta"
              type="text"
              autoComplete="off"
              maxLength={120}
              value={formulario.timeCasa}
              onChange={(event) =>
                atualizarCampo(
                  "timeCasa",
                  event.target.value
                )
              }
              placeholder="Ex.: Flamengo"
              disabled={bloqueado}
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="hidden pb-3 text-sm font-bold text-zinc-600 sm:block">
            X
          </div>

          <div>
            <label
              htmlFor="time-visitante-aposta"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Segundo time
            </label>

            <input
              id="time-visitante-aposta"
              type="text"
              autoComplete="off"
              maxLength={120}
              value={formulario.timeVisitante}
              onChange={(event) =>
                atualizarCampo(
                  "timeVisitante",
                  event.target.value
                )
              }
              placeholder="Ex.: Palmeiras"
              disabled={bloqueado}
              className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        {formulario.timeCasa.trim() &&
          formulario.timeVisitante.trim() && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-zinc-300">
              {formulario.timeCasa.trim()}
              <span className="mx-3 text-red-500">
                X
              </span>
              {formulario.timeVisitante.trim()}
            </div>
          )}
      </div>

      <div>
        <label
          htmlFor="casa-aposta"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Casa de aposta
          <span className="ml-1 text-zinc-600">
            (opcional)
          </span>
        </label>

        <input
          id="casa-aposta"
          type="text"
          autoComplete="off"
          maxLength={120}
          value={formulario.casaAposta}
          onChange={(event) =>
            atualizarCampo(
              "casaAposta",
              event.target.value
            )
          }
          placeholder="Ex.: Betano"
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="valor-apostado"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor apostado
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-medium text-zinc-500">
              R$
            </span>

            <input
              id="valor-apostado"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={formulario.valorApostado}
              onChange={(event) =>
                atualizarCampo(
                  "valorApostado",
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
            htmlFor="odd-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Odd
          </label>

          <input
            id="odd-aposta"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={formulario.odd}
            onChange={(event) =>
              atualizarCampo(
                "odd",
                event.target.value
              )
            }
            placeholder="Ex.: 1,85"
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-zinc-300">
          Resultado
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {OPCOES_RESULTADO.map((opcao) => {
            const selecionado =
              formulario.resultado ===
              opcao.valor;

            return (
              <button
                key={opcao.valor}
                type="button"
                onClick={() =>
                  atualizarResultado(
                    opcao.valor
                  )
                }
                disabled={bloqueado}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  selecionado
                    ? opcao.valor === "ganha"
                      ? "border-emerald-600 bg-emerald-950/50 text-emerald-300"
                      : opcao.valor === "perdida"
                        ? "border-red-600 bg-red-950/50 text-red-300"
                        : opcao.valor === "anulada"
                          ? "border-zinc-500 bg-zinc-800 text-zinc-200"
                          : "border-amber-600 bg-amber-950/40 text-amber-300"
                    : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                }`}
              >
                {opcao.texto}
              </button>
            );
          })}
        </div>
      </div>

      <CampoData
        id="data-aposta"
        label="Data da aposta"
        value={formulario.dataAposta}
        onChange={(valor) =>
          atualizarCampo(
            "dataAposta",
            valor
          )
        }
        required
        descricao="Data em que a aposta foi realizada."
      />

      <div>
        <label
          htmlFor="observacao-aposta"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Observação
          <span className="ml-1 text-zinc-600">
            (opcional)
          </span>
        </label>

        <textarea
          id="observacao-aposta"
          rows={4}
          maxLength={500}
          value={formulario.observacao}
          onChange={(event) =>
            atualizarCampo(
              "observacao",
              event.target.value
            )
          }
          placeholder="Ex.: Mercado de resultado final."
          disabled={bloqueado}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {valorApostado > 0 && odd >= 1 && (
        <div className="rounded-2xl border border-zinc-800 bg-black p-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-500">
                Valor apostado
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {formatarMoeda(valorApostado)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Retorno potencial
              </p>

              <p className="mt-2 text-lg font-bold text-white">
                {formatarMoeda(
                  retornoPotencial
                )}
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                Odd {formatarOdd(odd)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Lucro ou prejuízo
              </p>

              <p
                className={`mt-2 text-lg font-bold ${
                  lucroPrejuizo > 0
                    ? "text-emerald-400"
                    : lucroPrejuizo < 0
                      ? "text-red-400"
                      : "text-zinc-300"
                }`}
              >
                {lucroPrejuizo > 0
                  ? "+"
                  : ""}
                {formatarMoeda(
                  lucroPrejuizo
                )}
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
              : "Salvar aposta"}
        </button>
      </div>
    </form>
  );
}