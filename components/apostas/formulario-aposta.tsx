"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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
  criarFormularioDaDica,
} from "@/types/aposta";

import type {
  Aposta,
  DicaParaAposta,
  FormularioAposta as DadosFormularioAposta,
  ResultadoAposta,
} from "@/types/aposta";

type FormularioApostaProps = {
  aposta?: Aposta | null;
  dicaOrigem?: DicaParaAposta | null;
  carregandoExterno?: boolean;
  onConcluido?: () => Promise<void> | void;
  onCancelar?: () => void;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(valor) ? valor : 0);
}

function formatarOdd(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(valor) ? valor : 0);
}

function converterApostaParaFormulario(
  aposta: Aposta
): DadosFormularioAposta {
  return {
    descricao: aposta.descricao,
    modalidade: aposta.modalidade,
    competicao: aposta.competicao ?? "",
    timeCasa: aposta.time_casa ?? "",
    timeVisitante: aposta.time_visitante ?? "",
    casaAposta: aposta.casa_aposta ?? "",
    valorApostado: Number(aposta.valor_apostado)
      .toFixed(2)
      .replace(".", ","),
    odd: Number(aposta.odd).toFixed(2).replace(".", ","),
    resultado: aposta.resultado,
    dataAposta: aposta.data_aposta,
    observacao: aposta.observacao ?? "",
  };
}

const OPCOES_RESULTADO: {
  valor: ResultadoAposta;
  texto: string;
}[] = [
  { valor: "pendente", texto: "Pendente" },
  { valor: "ganha", texto: "Ganha" },
  { valor: "perdida", texto: "Perdida" },
  { valor: "anulada", texto: "Anulada" },
];

export default function FormularioAposta({
  aposta = null,
  dicaOrigem = null,
  carregandoExterno = false,
  onConcluido,
  onCancelar,
}: FormularioApostaProps) {
  const supabase = useMemo(() => createClient(), []);

  const [formulario, setFormulario] = useState<DadosFormularioAposta>({
    ...FORMULARIO_APOSTA_INICIAL,
  });

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const modoEdicao = Boolean(aposta);
  const vindoDeDica = Boolean(!aposta && dicaOrigem);
  const bloqueado = carregando || carregandoExterno;

  const valorApostado = useMemo(
    () => converterValorMonetario(formulario.valorApostado),
    [formulario.valorApostado]
  );

  const odd = useMemo(
    () => converterOdd(formulario.odd),
    [formulario.odd]
  );

  const retornoPotencial = useMemo(
    () => calcularRetornoPotencial(valorApostado, odd),
    [odd, valorApostado]
  );

  const lucroPrejuizo = useMemo(
    () =>
      calcularLucroPrejuizo(
        valorApostado,
        retornoPotencial,
        formulario.resultado
      ),
    [formulario.resultado, retornoPotencial, valorApostado]
  );

  useEffect(() => {
    if (aposta) {
      setFormulario(converterApostaParaFormulario(aposta));
    } else if (dicaOrigem) {
      setFormulario(criarFormularioDaDica(dicaOrigem));
    } else {
      setFormulario({ ...FORMULARIO_APOSTA_INICIAL });
    }

    setErro("");
    setSucesso("");
  }, [aposta, dicaOrigem]);

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

  function atualizarResultado(resultado: ResultadoAposta) {
    setFormulario((estadoAtual) => ({
      ...estadoAtual,
      resultado,
    }));
    setErro("");
    setSucesso("");
  }

  function validarFormulario() {
    if (!formulario.descricao.trim()) return "Informe a descrição da aposta.";
    if (!formulario.modalidade) return "Selecione a modalidade.";
    if (!formulario.competicao.trim()) return "Informe ou selecione a competição.";
    if (!formulario.timeCasa.trim()) return "Informe o primeiro time do confronto.";
    if (!formulario.timeVisitante.trim()) return "Informe o segundo time do confronto.";

    if (
      formulario.timeCasa.trim().toLocaleLowerCase("pt-BR") ===
      formulario.timeVisitante.trim().toLocaleLowerCase("pt-BR")
    ) {
      return "Os times do confronto devem ser diferentes.";
    }

    if (!Number.isFinite(valorApostado) || valorApostado <= 0) {
      return "Informe um valor apostado válido.";
    }

    if (!Number.isFinite(odd) || odd < 1) {
      return "Informe uma odd válida, igual ou superior a 1,00.";
    }

    if (!formulario.dataAposta) return "Informe a data da aposta.";
    return "";
  }

  async function salvarAposta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const mensagemValidacao = validarFormulario();
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

      if (usuarioError) throw usuarioError;

      const usuario = usuarioData.user;
      if (!usuario) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      const dadosAposta = converterFormularioParaAposta(formulario, {
        dicaId: aposta?.dica_id ?? dicaOrigem?.id ?? null,
        fixtureId: aposta?.fixture_id ?? dicaOrigem?.fixture_id ?? null,
        origem: aposta?.origem ?? (dicaOrigem ? "dica" : "manual"),
      });

      if (aposta) {
        const { error } = await supabase
          .from("apostas")
          .update({
            ...dadosAposta,
            updated_at: new Date().toISOString(),
          })
          .eq("id", aposta.id)
          .eq("user_id", usuario.id);

        if (error) throw error;
        setSucesso("Aposta atualizada com sucesso.");
      } else {
        const { error } = await supabase.from("apostas").insert({
          user_id: usuario.id,
          ...dadosAposta,
        });

        if (error) {
          if (error.code === "23505") {
            throw new Error("Esta dica já foi usada como aposta.");
          }
          throw error;
        }

        setSucesso(
          dicaOrigem
            ? "Dica adicionada às suas apostas."
            : "Aposta cadastrada com sucesso."
        );
      }

      await onConcluido?.();
    } catch (error) {
      console.error("Erro ao salvar aposta:", error);
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
    <form onSubmit={salvarAposta} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-white">
          {modoEdicao
            ? "Editar aposta"
            : vindoDeDica
              ? "Usar dica como aposta"
              : "Nova aposta"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {modoEdicao
            ? "Atualize o confronto, os dados e o resultado da aposta."
            : vindoDeDica
              ? "Confira os dados da entrada e informe o valor realmente apostado."
              : "Registre o confronto e acompanhe seu desempenho."}
        </p>
      </div>

      {vindoDeDica && (
        <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 px-4 py-3 text-sm text-blue-300">
          Esta aposta ficará vinculada à dica #{dicaOrigem?.id}.
        </div>
      )}

      {erro && (
        <div className="rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
          {sucesso}
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-300">
          Descrição da aposta
        </label>
        <input
          value={formulario.descricao}
          onChange={(event) => atualizarCampo("descricao", event.target.value)}
          disabled={bloqueado}
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Modalidade
          </label>
          <select
            value={formulario.modalidade}
            onChange={(event) => atualizarCampo("modalidade", event.target.value)}
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
          >
            <option value="">Selecione a modalidade</option>
            {MODALIDADES_APOSTAS.map((modalidade) => (
              <option key={modalidade} value={modalidade}>
                {modalidade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-300">
            Competição
          </label>
          <input
            list="lista-competicoes-apostas"
            value={formulario.competicao}
            onChange={(event) => atualizarCampo("competicao", event.target.value)}
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
          />
          <datalist id="lista-competicoes-apostas">
            {COMPETICOES_APOSTAS.map((competicao) => (
              <option key={competicao} value={competicao} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <input
          value={formulario.timeCasa}
          onChange={(event) => atualizarCampo("timeCasa", event.target.value)}
          disabled={bloqueado}
          placeholder="Time da casa"
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
        />
        <input
          value={formulario.timeVisitante}
          onChange={(event) => atualizarCampo("timeVisitante", event.target.value)}
          disabled={bloqueado}
          placeholder="Time visitante"
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
        />
      </div>

      <input
        value={formulario.casaAposta}
        onChange={(event) => atualizarCampo("casaAposta", event.target.value)}
        disabled={bloqueado}
        placeholder="Casa de aposta (opcional)"
        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <input
          value={formulario.valorApostado}
          onChange={(event) => atualizarCampo("valorApostado", event.target.value)}
          disabled={bloqueado}
          placeholder="Valor apostado"
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
        />
        <input
          value={formulario.odd}
          onChange={(event) => atualizarCampo("odd", event.target.value)}
          disabled={bloqueado}
          placeholder="Odd"
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {OPCOES_RESULTADO.map((opcao) => {
          const selecionado = formulario.resultado === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => atualizarResultado(opcao.valor)}
              disabled={bloqueado || vindoDeDica}
              className={`rounded-xl border px-3 py-3 text-sm font-semibold ${
                selecionado
                  ? "border-red-600 bg-red-950/40 text-white"
                  : "border-zinc-800 bg-black text-zinc-500"
              }`}
            >
              {opcao.texto}
            </button>
          );
        })}
      </div>

      <CampoData
        id="data-aposta"
        label="Data da aposta"
        value={formulario.dataAposta}
        onChange={(valor) => atualizarCampo("dataAposta", valor)}
        required
        descricao="Data em que a aposta foi realizada."
      />

      <textarea
        rows={4}
        value={formulario.observacao}
        onChange={(event) => atualizarCampo("observacao", event.target.value)}
        disabled={bloqueado}
        placeholder="Observação"
        className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none"
      />

      {valorApostado > 0 && odd >= 1 && (
        <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-black p-5 sm:grid-cols-3">
          <div>
            <p className="text-sm text-zinc-500">Valor apostado</p>
            <p className="mt-2 font-bold">{formatarMoeda(valorApostado)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Retorno potencial</p>
            <p className="mt-2 font-bold">{formatarMoeda(retornoPotencial)}</p>
            <p className="text-xs text-zinc-600">Odd {formatarOdd(odd)}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Lucro/prejuízo</p>
            <p className="mt-2 font-bold">{formatarMoeda(lucroPrejuizo)}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={bloqueado}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={bloqueado}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
        >
          {bloqueado
            ? "Salvando..."
            : modoEdicao
              ? "Salvar alterações"
              : vindoDeDica
                ? "Confirmar aposta"
                : "Salvar aposta"}
        </button>
      </div>
    </form>
  );
}
