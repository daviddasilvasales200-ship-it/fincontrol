"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FormularioAssinaturaProps = {
  userId: string;
  aoSalvar?: () => void;
};

const categorias = [
  "Streaming",
  "Música",
  "Jogos",
  "Software",
  "Armazenamento",
  "Educação",
  "Saúde",
  "Academia",
  "Telefonia",
  "Internet",
  "Assinaturas",
  "Outros",
];

function obterDataAtual(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function converterValorParaNumero(valor: string): number {
  const valorLimpo = valor
    .replace(/\s/g, "")
    .replace(/^R\$/, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Number(valorLimpo);
}

export default function FormularioAssinatura({
  userId,
  aoSalvar,
}: FormularioAssinaturaProps) {
  const router = useRouter();
  const supabase = createClient();

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("Assinaturas");
  const [valor, setValor] = useState("");
  const [diaVencimento, setDiaVencimento] = useState("");
  const [dataInicio, setDataInicio] = useState(obterDataAtual());
  const [observacao, setObservacao] = useState("");
  const [ativa, setAtiva] = useState(true);

  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);

  function limparFormulario() {
    setNome("");
    setCategoria("Assinaturas");
    setValor("");
    setDiaVencimento("");
    setDataInicio(obterDataAtual());
    setObservacao("");
    setAtiva(true);
  }

  async function salvarAssinatura(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);

    const nomeTratado = nome.trim();
    const valorNumerico = converterValorParaNumero(valor);
    const diaNumerico = Number(diaVencimento);

    if (!nomeTratado) {
      setMensagem("Digite o nome da assinatura.");
      return;
    }

    if (!categoria) {
      setMensagem("Selecione uma categoria.");
      return;
    }

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setMensagem("Digite um valor válido para a assinatura.");
      return;
    }

    if (
      !Number.isInteger(diaNumerico) ||
      diaNumerico < 1 ||
      diaNumerico > 31
    ) {
      setMensagem("O dia de vencimento deve estar entre 1 e 31.");
      return;
    }

    if (!dataInicio) {
      setMensagem("Informe a data de início da assinatura.");
      return;
    }

    setCarregando(true);

    try {
      const {
        data: { user },
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario) {
        throw new Error(erroUsuario.message);
      }

      if (!user) {
        throw new Error(
          "Sua sessão expirou. Faça login novamente."
        );
      }

      if (userId && user.id !== userId) {
        throw new Error(
          "O usuário autenticado não corresponde ao usuário da página."
        );
      }

      const { error: erroInsercao } = await supabase
        .from("assinaturas")
        .insert({
          user_id: user.id,
          nome: nomeTratado,
          categoria,
          valor: valorNumerico,
          dia_vencimento: diaNumerico,
          data_inicio: dataInicio,
          observacao: observacao.trim() || null,
          ativa,
        });

      if (erroInsercao) {
        console.error(
          "Erro ao cadastrar assinatura:",
          erroInsercao
        );

        throw new Error(erroInsercao.message);
      }

      limparFormulario();

      setSucesso(true);
      setMensagem(
        "Assinatura cadastrada e cobrança mensal gerada com sucesso."
      );

      router.refresh();
      aoSalvar?.();
    } catch (erro) {
      console.error("Erro ao salvar assinatura:", erro);

      setSucesso(false);
      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível cadastrar a assinatura."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <header>
        <p className="text-sm font-semibold text-red-500">
          Nova assinatura
        </p>

        <h2 className="mt-1 text-xl font-semibold text-white">
          Adicionar serviço recorrente
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Cadastre Netflix, Amazon Prime, Spotify, academia e
          outros pagamentos mensais.
        </p>
      </header>

      <form
        onSubmit={salvarAssinatura}
        className="mt-6 space-y-5"
      >
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
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Ex.: Netflix"
            autoComplete="off"
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />
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
            value={categoria}
            onChange={(event) =>
              setCategoria(event.target.value)
            }
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          >
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="valor-assinatura"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Valor mensal
            </label>

            <div className="flex overflow-hidden rounded-xl border border-zinc-700 bg-black transition focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-600/20">
              <span className="flex items-center border-r border-zinc-800 px-4 text-sm text-zinc-500">
                R$
              </span>

              <input
                id="valor-assinatura"
                type="text"
                inputMode="decimal"
                value={valor}
                onChange={(event) =>
                  setValor(event.target.value)
                }
                placeholder="0,00"
                required
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-white outline-none placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="dia-vencimento"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Dia do vencimento
            </label>

            <input
              id="dia-vencimento"
              type="number"
              inputMode="numeric"
              min={1}
              max={31}
              value={diaVencimento}
              onChange={(event) =>
                setDiaVencimento(event.target.value)
              }
              placeholder="Ex.: 15"
              required
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
            />

            <p className="mt-2 text-xs text-zinc-600">
              Para meses mais curtos, será usado o último dia
              disponível.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor="data-inicio"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Data de início
          </label>

          <input
            id="data-inicio"
            type="date"
            value={dataInicio}
            onChange={(event) =>
              setDataInicio(event.target.value)
            }
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />

          <p className="mt-2 text-xs text-zinc-600">
            A cobrança recorrente será considerada a partir desta
            data.
          </p>
        </div>

        <div>
          <label
            htmlFor="observacao-assinatura"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Observação
            <span className="ml-1 font-normal text-zinc-600">
              (opcional)
            </span>
          </label>

          <textarea
            id="observacao-assinatura"
            value={observacao}
            onChange={(event) =>
              setObservacao(event.target.value)
            }
            placeholder="Ex.: Plano padrão, cobrança no cartão..."
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-black p-4">
          <div>
            <p className="text-sm font-medium text-white">
              Assinatura ativa
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Quando ativa, a assinatura será incluída nas
              movimentações mensais.
            </p>
          </div>

          <input
            type="checkbox"
            checked={ativa}
            onChange={(event) =>
              setAtiva(event.target.checked)
            }
            className="h-5 w-5 shrink-0 accent-red-600"
          />
        </label>

        {mensagem && (
          <div
            role="alert"
            className={`rounded-xl border p-4 text-sm ${
              sucesso
                ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                : "border-red-800 bg-red-950/40 text-red-400"
            }`}
          >
            {mensagem}
          </div>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando
            ? "Salvando assinatura..."
            : "Adicionar assinatura"}
        </button>
      </form>
    </section>
  );
}