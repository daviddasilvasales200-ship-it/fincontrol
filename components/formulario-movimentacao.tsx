"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import CampoData from "@/components/campo-data";
import { createClient } from "@/lib/supabase/client";

type FormularioMovimentacaoProps = {
  tipo: "receita" | "despesa";
  userId: string;
};

const categoriasReceita = [
  "Salário",
  "Comissão",
  "Freelance",
  "Investimentos",
  "Apostas",
  "Presente",
  "Outros",
];

const categoriasDespesa = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Cartão",
  "Contas",
  "Apostas",
  "Outros",
];

function obterDataAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

export default function FormularioMovimentacao({
  tipo,
  userId,
}: FormularioMovimentacaoProps) {
  const router = useRouter();
  const supabase = createClient();

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(obterDataAtual());
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const categorias =
    tipo === "receita" ? categoriasReceita : categoriasDespesa;

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);
    setCarregando(true);

    try {
      const valorNumerico = Number(
        valor.replace(/\./g, "").replace(",", ".")
      );

      if (!descricao.trim()) {
        setMensagem("Digite uma descrição.");
        return;
      }

      if (!categoria) {
        setMensagem("Selecione uma categoria.");
        return;
      }

      if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
        setMensagem("Digite um valor válido.");
        return;
      }

      if (!data) {
        setMensagem("Selecione uma data.");
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        setMensagem(`Erro na sessão: ${sessionError.message}`);
        return;
      }

      if (!session?.user) {
        setMensagem(
          "Sua sessão não foi encontrada. Saia da conta e faça login novamente."
        );
        return;
      }

      const { data: novaMovimentacao, error } = await supabase
        .from("movimentacoes")
        .insert({
          user_id: session.user.id || userId,
          tipo,
          descricao: descricao.trim(),
          categoria,
          valor: valorNumerico,
          data,
          observacao: observacao.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro do Supabase:", error);

        setMensagem(
          `Erro ao salvar: ${error.message}` +
            (error.details ? ` | ${error.details}` : "") +
            (error.hint ? ` | ${error.hint}` : "") +
            (error.code ? ` | Código: ${error.code}` : "")
        );

        return;
      }

      console.log("Movimentação cadastrada:", novaMovimentacao);

      setDescricao("");
      setCategoria("");
      setValor("");
      setData(obterDataAtual());
      setObservacao("");
      setSucesso(true);

      setMensagem(
        tipo === "receita"
          ? "Receita cadastrada com sucesso!"
          : "Despesa cadastrada com sucesso!"
      );

      router.refresh();
    } catch (erro) {
      console.error("Erro inesperado:", erro);

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Ocorreu um erro inesperado ao salvar."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-xl font-semibold text-white">
        Adicionar {tipo === "receita" ? "receita" : "despesa"}
      </h2>

      <form onSubmit={salvar} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor={`descricao-${tipo}`}
            className="mb-2 block text-sm text-zinc-300"
          >
            Descrição
          </label>

          <input
            id={`descricao-${tipo}`}
            type="text"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder={
              tipo === "receita" ? "Ex.: Salário" : "Ex.: Mercado"
            }
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        <div>
          <label
            htmlFor={`valor-${tipo}`}
            className="mb-2 block text-sm text-zinc-300"
          >
            Valor
          </label>

          <input
            id={`valor-${tipo}`}
            type="text"
            inputMode="decimal"
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            placeholder="0,00"
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        <div>
          <label
            htmlFor={`categoria-${tipo}`}
            className="mb-2 block text-sm text-zinc-300"
          >
            Categoria
          </label>

          <select
            id={`categoria-${tipo}`}
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          >
            <option value="">Selecione uma categoria</option>

            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <CampoData
          id={`data-${tipo}`}
          label="Data"
          value={data}
          onChange={setData}
          required
          descricao="Clique no ícone para selecionar uma data."
        />

        <div>
          <label
            htmlFor={`observacao-${tipo}`}
            className="mb-2 block text-sm text-zinc-300"
          >
            Observação
          </label>

          <textarea
            id={`observacao-${tipo}`}
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            placeholder="Opcional"
            rows={3}
            className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
          />
        </div>

        {mensagem && (
          <div
            role="alert"
            className={`rounded-xl border p-3 text-sm ${
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
          className={`w-full rounded-xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
            tipo === "receita"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {carregando
            ? "Salvando..."
            : tipo === "receita"
              ? "Salvar receita"
              : "Salvar despesa"}
        </button>
      </form>
    </section>
  );
}