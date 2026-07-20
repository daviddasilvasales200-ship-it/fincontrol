"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CampoData from "@/components/campo-data";

type FormularioParcelamentoProps = {
  userId: string;
};

const categorias = [
  "Alimentação",
  "Moradia",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Eletrônicos",
  "Móveis",
  "Vestuário",
  "Cartão",
  "Viagem",
  "Outros",
];

function converterValor(valor: string) {
  return Number(valor.replace(/\./g, "").replace(",", "."));
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function FormularioParcelamento({
  userId,
}: FormularioParcelamentoProps) {
  const router = useRouter();
  const supabase = createClient();

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valorTotal, setValorTotal] = useState("");
  const [quantidadeParcelas, setQuantidadeParcelas] = useState("2");
  const [dataPrimeiraParcela, setDataPrimeiraParcela] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacao, setObservacao] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const valorParcela = useMemo(() => {
    const total = converterValor(valorTotal);
    const parcelas = Number(quantidadeParcelas);

    if (
      !Number.isFinite(total) ||
      total <= 0 ||
      !Number.isInteger(parcelas) ||
      parcelas <= 1
    ) {
      return 0;
    }

    return Math.floor((total / parcelas) * 100) / 100;
  }, [valorTotal, quantidadeParcelas]);

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);
    setCarregando(true);

    try {
      const total = converterValor(valorTotal);
      const parcelas = Number(quantidadeParcelas);

      if (!descricao.trim()) {
        setMensagem("Digite uma descrição.");
        return;
      }

      if (!categoria) {
        setMensagem("Selecione uma categoria.");
        return;
      }

      if (!Number.isFinite(total) || total <= 0) {
        setMensagem("Digite um valor total válido.");
        return;
      }

      if (
        !Number.isInteger(parcelas) ||
        parcelas < 2 ||
        parcelas > 120
      ) {
        setMensagem("Escolha entre 2 e 120 parcelas.");
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
        setMensagem("Sua sessão expirou. Entre novamente.");
        return;
      }

      const { error } = await supabase.from("parcelamentos").insert({
        user_id: session.user.id || userId,
        descricao: descricao.trim(),
        categoria,
        valor_total: total,
        quantidade_parcelas: parcelas,
        valor_parcela: valorParcela,
        data_primeira_parcela: dataPrimeiraParcela,
        observacao: observacao.trim() || null,
      });

      if (error) {
        console.error("Erro ao criar parcelamento:", error);

        setMensagem(
          `Erro ao salvar: ${error.message}` +
            (error.code ? ` | Código: ${error.code}` : "")
        );

        return;
      }

      setDescricao("");
      setCategoria("");
      setValorTotal("");
      setQuantidadeParcelas("2");
      setObservacao("");
      setSucesso(true);
      setMensagem("Parcelamento cadastrado com sucesso!");

      router.refresh();
    } catch (erro) {
      console.error("Erro inesperado:", erro);

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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-xl font-semibold">
        Adicionar parcelamento
      </h2>

      <form onSubmit={salvar} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="descricao-parcelamento"
            className="mb-2 block text-sm text-zinc-300"
          >
            Descrição
          </label>

          <input
            id="descricao-parcelamento"
            type="text"
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Ex.: Notebook"
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label
            htmlFor="valor-total"
            className="mb-2 block text-sm text-zinc-300"
          >
            Valor total
          </label>

          <input
            id="valor-total"
            type="text"
            inputMode="decimal"
            value={valorTotal}
            onChange={(event) => setValorTotal(event.target.value)}
            placeholder="Ex.: 3.600,00"
            required
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
          />
        </div>

        <div>
          <label
            htmlFor="quantidade-parcelas"
            className="mb-2 block text-sm text-zinc-300"
          >
            Quantidade de parcelas
          </label>

          <select
            id="quantidade-parcelas"
            value={quantidadeParcelas}
            onChange={(event) =>
              setQuantidadeParcelas(event.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
          >
            {Array.from({ length: 35 }, (_, indice) => {
              const numero = indice + 2;

              return (
                <option key={numero} value={numero}>
                  {numero}x
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="categoria-parcelamento"
            className="mb-2 block text-sm text-zinc-300"
          >
            Categoria
          </label>

          <select
            id="categoria-parcelamento"
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

        <CampoData
  id="data-primeira-parcela"
  label="Data da primeira parcela"
  value={dataPrimeiraParcela}
  onChange={setDataPrimeiraParcela}
  required
  descricao="Clique no ícone para selecionar a data da primeira parcela."
/>

        <div>
          <label
            htmlFor="observacao-parcelamento"
            className="mb-2 block text-sm text-zinc-300"
          >
            Observação
          </label>

          <textarea
            id="observacao-parcelamento"
            value={observacao}
            onChange={(event) => setObservacao(event.target.value)}
            rows={3}
            placeholder="Opcional"
            className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
          />
        </div>

        {valorParcela > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-black p-4">
            <p className="text-sm text-zinc-500">
              Valor aproximado de cada parcela
            </p>

            <p className="mt-1 text-xl font-bold text-red-500">
              {formatarMoeda(valorParcela)}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              A última parcela poderá ter ajuste de centavos.
            </p>
          </div>
        )}

        {mensagem && (
          <div
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
          className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando
            ? "Criando parcelas..."
            : "Salvar parcelamento"}
        </button>
      </form>
    </section>
  );
}