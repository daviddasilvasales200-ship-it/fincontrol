"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type TipoMovimentacao = "receita" | "despesa";

type Movimentacao = {
  id: number;
  tipo: TipoMovimentacao;
  descricao: string;
  categoria: string;
  valor: number | string;
  data: string;
  observacao: string | null;
};

type AcoesMovimentacaoProps = {
  movimentacao: Movimentacao;
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

export default function AcoesMovimentacao({
  movimentacao,
}: AcoesMovimentacaoProps) {
  const router = useRouter();
  const supabase = createClient();

  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);

  const [descricao, setDescricao] = useState(movimentacao.descricao);
  const [categoria, setCategoria] = useState(movimentacao.categoria);
  const [valor, setValor] = useState(
    Number(movimentacao.valor).toFixed(2).replace(".", ",")
  );
  const [data, setData] = useState(movimentacao.data);
  const [observacao, setObservacao] = useState(
    movimentacao.observacao ?? ""
  );

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const categorias =
    movimentacao.tipo === "receita"
      ? categoriasReceita
      : categoriasDespesa;

  function fecharEdicao() {
    if (carregando) return;

    setMensagem("");
    setModalEditarAberto(false);
  }

  async function editar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
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

      const { error } = await supabase
        .from("movimentacoes")
        .update({
          descricao: descricao.trim(),
          categoria,
          valor: valorNumerico,
          data,
          observacao: observacao.trim() || null,
        })
        .eq("id", movimentacao.id);

      if (error) {
        console.error("Erro ao editar movimentação:", error);

        setMensagem(
          `Erro ao editar: ${error.message}` +
            (error.code ? ` | Código: ${error.code}` : "")
        );

        return;
      }

      setModalEditarAberto(false);
      router.refresh();
    } catch (erro) {
      console.error("Erro inesperado ao editar:", erro);

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluir() {
    setMensagem("");
    setCarregando(true);

    try {
      const { error } = await supabase
        .from("movimentacoes")
        .delete()
        .eq("id", movimentacao.id);

      if (error) {
        console.error("Erro ao excluir movimentação:", error);

        setMensagem(
          `Erro ao excluir: ${error.message}` +
            (error.code ? ` | Código: ${error.code}` : "")
        );

        return;
      }

      setModalExcluirAberto(false);
      router.refresh();
    } catch (erro) {
      console.error("Erro inesperado ao excluir:", erro);

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setMensagem("");
            setModalEditarAberto(true);
          }}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-amber-500 hover:text-amber-400"
        >
          Editar
        </button>

        <button
          type="button"
          onClick={() => {
            setMensagem("");
            setModalExcluirAberto(true);
          }}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-red-600 hover:text-red-500"
        >
          Excluir
        </button>
      </div>

      {modalEditarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
          <section className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Editar{" "}
                  {movimentacao.tipo === "receita"
                    ? "receita"
                    : "despesa"}
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Atualize os dados do lançamento.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharEdicao}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editar} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor={`descricao-${movimentacao.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Descrição
                </label>

                <input
                  id={`descricao-${movimentacao.id}`}
                  type="text"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor={`valor-${movimentacao.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Valor
                </label>

                <input
                  id={`valor-${movimentacao.id}`}
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={(event) => setValor(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor={`categoria-${movimentacao.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Categoria
                </label>

                <select
                  id={`categoria-${movimentacao.id}`}
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                >
                  <option value="">Selecione uma categoria</option>

                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`data-${movimentacao.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Data
                </label>

                <input
                  id={`data-${movimentacao.id}`}
                  type="date"
                  value={data}
                  onChange={(event) => setData(event.target.value)}
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor={`observacao-${movimentacao.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Observação
                </label>

                <textarea
                  id={`observacao-${movimentacao.id}`}
                  value={observacao}
                  onChange={(event) => setObservacao(event.target.value)}
                  rows={3}
                  placeholder="Opcional"
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              {mensagem && (
                <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                  {mensagem}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharEdicao}
                  disabled={carregando}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:border-zinc-500 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className="rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modalExcluirAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-950 text-xl text-red-500">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              Excluir receita?
            </h2>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              O lançamento{" "}
              <strong className="text-white">
                {movimentacao.descricao}
              </strong>{" "}
              será removido permanentemente. Essa ação não poderá ser
              desfeita.
            </p>

            {mensagem && (
              <div className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                {mensagem}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (carregando) return;

                  setMensagem("");
                  setModalExcluirAberto(false);
                }}
                disabled={carregando}
                className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:border-zinc-500 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluir}
                disabled={carregando}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando ? "Excluindo..." : "Excluir definitivamente"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}