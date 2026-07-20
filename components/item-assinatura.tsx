"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Assinatura = {
  id: number;
  nome: string;
  categoria: string;
  valor: number | string;
  dia_vencimento: number;
  data_inicio: string;
  observacao: string | null;
  ativa: boolean;
};

type ItemAssinaturaProps = {
  assinatura: Assinatura;
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

function converterValor(valor: string): number {
  return Number(
    valor
      .replace(/\s/g, "")
      .replace(/^R\$/, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

function formatarMoeda(valor: number | string): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

export default function ItemAssinatura({
  assinatura,
}: ItemAssinaturaProps) {
  const router = useRouter();
  const supabase = createClient();

  const [modalEditarAberto, setModalEditarAberto] =
    useState(false);

  const [modalExcluirAberto, setModalExcluirAberto] =
    useState(false);

  const [nome, setNome] = useState(assinatura.nome);
  const [categoria, setCategoria] = useState(
    assinatura.categoria
  );

  const [valor, setValor] = useState(
    Number(assinatura.valor).toFixed(2).replace(".", ",")
  );

  const [diaVencimento, setDiaVencimento] = useState(
    String(assinatura.dia_vencimento)
  );

  const [dataInicio, setDataInicio] = useState(
    assinatura.data_inicio
  );

  const [observacao, setObservacao] = useState(
    assinatura.observacao ?? ""
  );

  const [ativa, setAtiva] = useState(assinatura.ativa);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  function abrirEdicao() {
    setNome(assinatura.nome);
    setCategoria(assinatura.categoria);

    setValor(
      Number(assinatura.valor).toFixed(2).replace(".", ",")
    );

    setDiaVencimento(
      String(assinatura.dia_vencimento)
    );

    setDataInicio(assinatura.data_inicio);
    setObservacao(assinatura.observacao ?? "");
    setAtiva(assinatura.ativa);
    setMensagem("");
    setModalEditarAberto(true);
  }

  function fecharEdicao() {
    if (carregando) return;

    setMensagem("");
    setModalEditarAberto(false);
  }

  async function editarAssinatura(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensagem("");

    const nomeTratado = nome.trim();
    const valorNumerico = converterValor(valor);
    const diaNumerico = Number(diaVencimento);

    if (!nomeTratado) {
      setMensagem("Digite o nome da assinatura.");
      return;
    }

    if (!categoria) {
      setMensagem("Selecione uma categoria.");
      return;
    }

    if (
      !Number.isFinite(valorNumerico) ||
      valorNumerico <= 0
    ) {
      setMensagem("Digite um valor válido.");
      return;
    }

    if (
      !Number.isInteger(diaNumerico) ||
      diaNumerico < 1 ||
      diaNumerico > 31
    ) {
      setMensagem(
        "O dia do vencimento deve estar entre 1 e 31."
      );

      return;
    }

    if (!dataInicio) {
      setMensagem("Informe a data de início.");
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase
        .from("assinaturas")
        .update({
          nome: nomeTratado,
          categoria,
          valor: valorNumerico,
          dia_vencimento: diaNumerico,
          data_inicio: dataInicio,
          observacao: observacao.trim() || null,
          ativa,
        })
        .eq("id", assinatura.id);

      if (error) {
        console.error(
          "Erro ao editar assinatura:",
          error
        );

        setMensagem(
          `Erro ao editar: ${error.message}` +
            (error.code
              ? ` | Código: ${error.code}`
              : "")
        );

        return;
      }

      setModalEditarAberto(false);
      router.refresh();
    } catch (erro) {
      console.error(
        "Erro inesperado ao editar assinatura:",
        erro
      );

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível editar a assinatura."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function alternarStatus() {
    setMensagem("");
    setCarregando(true);

    try {
      const novoStatus = !assinatura.ativa;

      const { error } = await supabase
        .from("assinaturas")
        .update({
          ativa: novoStatus,
        })
        .eq("id", assinatura.id);

      if (error) {
        console.error(
          "Erro ao alterar status:",
          error
        );

        setMensagem(
          `Erro ao alterar status: ${error.message}`
        );

        return;
      }

      router.refresh();
    } catch (erro) {
      console.error(
        "Erro inesperado ao alterar status:",
        erro
      );

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível alterar o status."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluirAssinatura() {
    setMensagem("");
    setCarregando(true);

    try {
      const { error } = await supabase
        .from("assinaturas")
        .delete()
        .eq("id", assinatura.id);

      if (error) {
        console.error(
          "Erro ao excluir assinatura:",
          error
        );

        setMensagem(
          `Erro ao excluir: ${error.message}` +
            (error.code
              ? ` | Código: ${error.code}`
              : "")
        );

        return;
      }

      setModalExcluirAberto(false);
      router.refresh();
    } catch (erro) {
      console.error(
        "Erro inesperado ao excluir assinatura:",
        erro
      );

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível excluir a assinatura."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <>
      <article className="rounded-xl border border-zinc-800 bg-black p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold text-white">
                {assinatura.nome}
              </h3>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  assinatura.ativa
                    ? "bg-emerald-950 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {assinatura.ativa
                  ? "Ativa"
                  : "Inativa"}
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              {assinatura.categoria}
              {" • "}
              Vencimento dia{" "}
              {assinatura.dia_vencimento}
            </p>

            {assinatura.observacao && (
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-600">
                {assinatura.observacao}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="sm:min-w-28 sm:text-right">
              <p className="whitespace-nowrap text-lg font-bold text-white">
                {formatarMoeda(assinatura.valor)}
              </p>

              <p className="text-xs text-zinc-600">
                por mês
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={abrirEdicao}
                disabled={carregando}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-amber-500 hover:text-amber-400 disabled:opacity-50"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={alternarStatus}
                disabled={carregando}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-blue-500 hover:text-blue-400 disabled:opacity-50"
              >
                {assinatura.ativa
                  ? "Desativar"
                  : "Ativar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMensagem("");
                  setModalExcluirAberto(true);
                }}
                disabled={carregando}
                className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-300 transition hover:border-red-600 hover:text-red-500 disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        {mensagem && !modalEditarAberto && (
          <p className="mt-3 rounded-lg border border-red-900 bg-red-950/30 p-3 text-sm text-red-400">
            {mensagem}
          </p>
        )}
      </article>

      {modalEditarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-8">
          <section className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Editar assinatura
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Atualize os dados do serviço recorrente.
                </p>
              </div>

              <button
                type="button"
                onClick={fecharEdicao}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:text-red-500"
                aria-label="Fechar edição"
              >
                ✕
              </button>
            </header>

            <form
              onSubmit={editarAssinatura}
              className="mt-6 space-y-4"
            >
              <div>
                <label
                  htmlFor={`nome-assinatura-${assinatura.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Nome da assinatura
                </label>

                <input
                  id={`nome-assinatura-${assinatura.id}`}
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor={`categoria-assinatura-${assinatura.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Categoria
                </label>

                <select
                  id={`categoria-assinatura-${assinatura.id}`}
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                >
                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`valor-assinatura-${assinatura.id}`}
                    className="mb-2 block text-sm text-zinc-300"
                  >
                    Valor mensal
                  </label>

                  <input
                    id={`valor-assinatura-${assinatura.id}`}
                    type="text"
                    inputMode="decimal"
                    value={valor}
                    onChange={(event) =>
                      setValor(event.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor={`vencimento-assinatura-${assinatura.id}`}
                    className="mb-2 block text-sm text-zinc-300"
                  >
                    Dia do vencimento
                  </label>

                  <input
                    id={`vencimento-assinatura-${assinatura.id}`}
                    type="number"
                    min={1}
                    max={31}
                    value={diaVencimento}
                    onChange={(event) =>
                      setDiaVencimento(
                        event.target.value
                      )
                    }
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor={`data-inicio-assinatura-${assinatura.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Data de início
                </label>

                <input
                  id={`data-inicio-assinatura-${assinatura.id}`}
                  type="date"
                  value={dataInicio}
                  onChange={(event) =>
                    setDataInicio(event.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label
                  htmlFor={`observacao-assinatura-${assinatura.id}`}
                  className="mb-2 block text-sm text-zinc-300"
                >
                  Observação
                </label>

                <textarea
                  id={`observacao-assinatura-${assinatura.id}`}
                  value={observacao}
                  onChange={(event) =>
                    setObservacao(event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                />
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-zinc-800 bg-black p-4">
                <div>
                  <p className="text-sm font-medium text-white">
                    Assinatura ativa
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Inclui o serviço nas cobranças mensais.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={ativa}
                  onChange={(event) =>
                    setAtiva(event.target.checked)
                  }
                  className="h-5 w-5 accent-red-600"
                />
              </label>

              {mensagem && (
                <p className="rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-400">
                  {mensagem}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharEdicao}
                  disabled={carregando}
                  className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {modalExcluirAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-xl text-red-500">
              !
            </div>

            <h2 className="mt-5 text-xl font-bold text-white">
              Excluir assinatura?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              A assinatura{" "}
              <strong className="text-zinc-300">
                {assinatura.nome}
              </strong>{" "}
              será excluída. As movimentações vinculadas a ela
              também poderão ser removidas devido à regra do banco
              de dados.
            </p>

            {mensagem && (
              <p className="mt-4 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-400">
                {mensagem}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (!carregando) {
                    setMensagem("");
                    setModalExcluirAberto(false);
                  }
                }}
                disabled={carregando}
                className="rounded-xl border border-zinc-700 px-5 py-3 font-semibold text-zinc-300 transition hover:bg-zinc-900 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirAssinatura}
                disabled={carregando}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {carregando
                  ? "Excluindo..."
                  : "Excluir assinatura"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}