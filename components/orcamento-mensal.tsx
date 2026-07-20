"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type OrcamentoMensalProps = {
  userId: string;
  anoMes: string;
  limiteInicial: number;
  despesasDoMes: number;
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function OrcamentoMensal({
  userId,
  anoMes,
  limiteInicial,
  despesasDoMes,
}: OrcamentoMensalProps) {
  const router = useRouter();
  const supabase = createClient();

  const [modalAberto, setModalAberto] = useState(false);
  const [limite, setLimite] = useState(
    limiteInicial > 0
      ? limiteInicial.toFixed(2).replace(".", ",")
      : ""
  );

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  const percentualReal =
    limiteInicial > 0
      ? (despesasDoMes / limiteInicial) * 100
      : 0;

  const percentualExibido = Math.round(percentualReal);
  const percentualCirculo = Math.min(percentualReal, 100);

  const restante = limiteInicial - despesasDoMes;
  const ultrapassou = restante < 0;

  function obterCor() {
    if (percentualReal >= 100) {
      return "#ef4444";
    }

    if (percentualReal >= 80) {
      return "#f59e0b";
    }

    if (percentualReal >= 60) {
      return "#eab308";
    }

    return "#10b981";
  }

  const corProgresso = obterCor();

  async function salvarOrcamento(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensagem("");
    setCarregando(true);

    try {
      const limiteNumerico = Number(
        limite.replace(/\./g, "").replace(",", ".")
      );

      if (
        !Number.isFinite(limiteNumerico) ||
        limiteNumerico <= 0
      ) {
        setMensagem("Digite um limite maior que zero.");
        return;
      }

      const { error } = await supabase
        .from("orcamentos")
        .upsert(
          {
            user_id: userId,
            ano_mes: anoMes,
            limite: limiteNumerico,
          },
          {
            onConflict: "user_id,ano_mes",
          }
        );

      if (error) {
        console.error("Erro ao salvar orçamento:", error);

        setMensagem(
          `Erro ao salvar: ${error.message}` +
            (error.code ? ` | Código: ${error.code}` : "")
        );

        return;
      }

      setModalAberto(false);
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
    <>
      <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h3 className="text-lg font-semibold">
          Orçamento mensal
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Limite de gastos do mês
        </p>

        <div className="mt-8 flex justify-center">
          <div
            className="flex h-44 w-44 items-center justify-center rounded-full p-[14px]"
            style={{
              background: `conic-gradient(
                ${corProgresso} ${percentualCirculo}%,
                #27272a ${percentualCirculo}% 100%
              )`,
            }}
          >
            <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-950">
              <div className="text-center">
                <p
                  className="text-3xl font-bold"
                  style={{
                    color:
                      limiteInicial > 0
                        ? corProgresso
                        : "#ffffff",
                  }}
                >
                  {percentualExibido}%
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  utilizado
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-zinc-500">Gasto</span>

            <span className="font-semibold">
              {formatarMoeda(despesasDoMes)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm">
            <span className="text-zinc-500">Limite</span>

            <span className="font-semibold">
              {formatarMoeda(limiteInicial)}
            </span>
          </div>

          {limiteInicial > 0 && (
            <div
              className={`mt-4 rounded-xl border p-4 ${
                ultrapassou
                  ? "border-red-900 bg-red-950/30"
                  : "border-zinc-800 bg-black"
              }`}
            >
              <p className="text-sm text-zinc-500">
                {ultrapassou
                  ? "Orçamento ultrapassado em"
                  : "Você ainda pode gastar"}
              </p>

              <p
                className={`mt-1 text-xl font-bold ${
                  ultrapassou
                    ? "text-red-500"
                    : "text-emerald-500"
                }`}
              >
                {formatarMoeda(Math.abs(restante))}
              </p>
            </div>
          )}

          {percentualReal >= 80 && percentualReal < 100 && (
            <div className="rounded-xl border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-400">
              Atenção: você já utilizou mais de 80% do
              orçamento.
            </div>
          )}

          {percentualReal >= 100 && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-400">
              Você ultrapassou o orçamento mensal.
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setMensagem("");
              setModalAberto(true);
            }}
            className="mt-3 w-full rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold transition hover:border-red-600 hover:text-red-500"
          >
            {limiteInicial > 0
              ? "Alterar orçamento"
              : "Definir orçamento"}
          </button>
        </div>
      </article>

      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Definir orçamento
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Informe o limite de gastos deste mês.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!carregando) {
                    setModalAberto(false);
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 hover:border-red-600 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={salvarOrcamento}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor="limite-orcamento"
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Limite mensal
                </label>

                <input
                  id="limite-orcamento"
                  type="text"
                  inputMode="decimal"
                  value={limite}
                  onChange={(event) =>
                    setLimite(event.target.value)
                  }
                  placeholder="Ex.: 3.000,00"
                  required
                  autoFocus
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-sm text-zinc-500">
                  Despesas atuais do mês
                </p>

                <p className="mt-1 text-lg font-bold text-red-500">
                  {formatarMoeda(despesasDoMes)}
                </p>
              </div>

              {mensagem && (
                <div className="rounded-xl border border-red-800 bg-red-950/40 p-3 text-sm text-red-400">
                  {mensagem}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={carregando}
                  onClick={() => setModalAberto(false)}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {carregando
                    ? "Salvando..."
                    : "Salvar orçamento"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}