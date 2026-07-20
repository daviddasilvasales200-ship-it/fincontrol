import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GraficoRelatorio from "@/components/grafico-relatorio";


type RelatoriosPageProps = {
  searchParams: Promise<{
    mes?: string;
    mesNumero?: string;
    ano?: string;
  }>;
};

type Movimentacao = {
  id: number;
  tipo: "receita" | "despesa";
  descricao: string;
  categoria: string;
  valor: number | string;
  data: string;
  observacao: string | null;
  created_at: string;
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
}

function mesValido(valor: string | undefined) {
  return Boolean(valor && /^\d{4}-\d{2}$/.test(valor));
}

function obterNomeMes(anoMes: string) {
  const [ano, mes] = anoMes.split("-").map(Number);

  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export default async function RelatoriosPage({
  searchParams,
}: RelatoriosPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const parametros = await searchParams;
  const hoje = new Date();

  const mesAtual = `${hoje.getFullYear()}-${String(
    hoje.getMonth() + 1
  ).padStart(2, "0")}`;

  const mesPelasCaixas =
    parametros.ano &&
    parametros.mesNumero &&
    /^\d{4}$/.test(parametros.ano) &&
    /^(0[1-9]|1[0-2])$/.test(parametros.mesNumero)
      ? `${parametros.ano}-${parametros.mesNumero}`
      : undefined;

  const mesSelecionado = mesValido(mesPelasCaixas)
    ? mesPelasCaixas!
    : mesValido(parametros.mes)
      ? parametros.mes!
      : mesAtual;

  const [anoSelecionado, numeroMesSelecionado] = mesSelecionado
    .split("-")
    .map(Number);

  const primeiroDia = `${mesSelecionado}-01`;

  const ultimoDiaNumero = new Date(
    anoSelecionado,
    numeroMesSelecionado,
    0
  ).getDate();

  const ultimoDia = `${mesSelecionado}-${String(
    ultimoDiaNumero
  ).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("movimentacoes")
    .select(
      "id, tipo, descricao, categoria, valor, data, observacao, created_at"
    )
    .eq("user_id", user.id)
    .gte("data", primeiroDia)
    .lte("data", ultimoDia)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar relatório:", error);
  }

  const movimentacoes = (data ?? []) as Movimentacao[];

  const receitas = movimentacoes.filter(
    (movimentacao) => movimentacao.tipo === "receita"
  );

  const despesas = movimentacoes.filter(
    (movimentacao) => movimentacao.tipo === "despesa"
  );

  const totalReceitas = receitas.reduce(
    (total, movimentacao) =>
      total + Number(movimentacao.valor),
    0
  );

  const totalDespesas = despesas.reduce(
    (total, movimentacao) =>
      total + Number(movimentacao.valor),
    0
  );

  const saldo = totalReceitas - totalDespesas;

  const economiaPercentual =
    totalReceitas > 0
      ? (saldo / totalReceitas) * 100
      : 0;

  const valoresPorDia = movimentacoes.reduce<
    Record<
      string,
      {
        receitas: number;
        despesas: number;
      }
    >
  >((resultado, movimentacao) => {
    const dia = movimentacao.data.slice(8, 10);

    if (!resultado[dia]) {
      resultado[dia] = {
        receitas: 0,
        despesas: 0,
      };
    }

    if (movimentacao.tipo === "receita") {
      resultado[dia].receitas += Number(movimentacao.valor);
    } else {
      resultado[dia].despesas += Number(movimentacao.valor);
    }

    return resultado;
  }, {});

  const dadosGrafico = Array.from(
    { length: ultimoDiaNumero },
    (_, indice) => {
      const dia = String(indice + 1).padStart(2, "0");

      return {
        dia,
        receitas: valoresPorDia[dia]?.receitas ?? 0,
        despesas: valoresPorDia[dia]?.despesas ?? 0,
      };
    }
  );

  const categoriasAgrupadas = despesas.reduce<
    Record<string, number>
  >((resultado, movimentacao) => {
    const categoria = movimentacao.categoria || "Outros";

    resultado[categoria] =
      (resultado[categoria] ?? 0) +
      Number(movimentacao.valor);

    return resultado;
  }, {});

  const categoriasOrdenadas = Object.entries(categoriasAgrupadas)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual:
        totalDespesas > 0
          ? (valor / totalDespesas) * 100
          : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  const maiorDespesa = despesas.reduce<Movimentacao | null>(
    (maior, movimentacao) => {
      if (
        !maior ||
        Number(movimentacao.valor) > Number(maior.valor)
      ) {
        return movimentacao;
      }

      return maior;
    },
    null
  );

  const maiorReceita = receitas.reduce<Movimentacao | null>(
    (maior, movimentacao) => {
      if (
        !maior ||
        Number(movimentacao.valor) > Number(maior.valor)
      ) {
        return movimentacao;
      }

      return maior;
    },
    null
  );

  return (
  <main className="min-h-screen px-4 py-8 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <p className="text-sm font-semibold text-red-500">
              FinControl
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Relatórios financeiros
            </h1>

            <p className="mt-2 text-zinc-400">
              Analise detalhadamente suas movimentações.
            </p>
          </header>

          <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <form
              method="GET"
              className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <div>
                <label
                  htmlFor="mesNumero"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Mês
                </label>

                <select
                  id="mesNumero"
                  name="mesNumero"
                  defaultValue={String(
                    numeroMesSelecionado
                  ).padStart(2, "0")}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                >
                  <option value="01">Janeiro</option>
                  <option value="02">Fevereiro</option>
                  <option value="03">Março</option>
                  <option value="04">Abril</option>
                  <option value="05">Maio</option>
                  <option value="06">Junho</option>
                  <option value="07">Julho</option>
                  <option value="08">Agosto</option>
                  <option value="09">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ano"
                  className="mb-2 block text-sm font-medium text-zinc-300"
                >
                  Ano
                </label>

                <select
                  id="ano"
                  name="ano"
                  defaultValue={String(anoSelecionado)}
                  className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-600"
                >
                  {Array.from({ length: 11 }, (_, indice) => {
                    const ano = hoje.getFullYear() - 5 + indice;

                    return (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                className="rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
              >
                Atualizar relatório
              </button>
            </form>
          </section>

          <div className="mb-6">
            <h2 className="text-xl font-semibold capitalize">
              Relatório de {obterNomeMes(mesSelecionado)}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Período de {formatarData(primeiroDia)} até{" "}
              {formatarData(ultimoDia)}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-400">
              Erro ao carregar o relatório: {error.message}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                Receitas do período
              </p>

              <p className="mt-2 text-2xl font-bold text-emerald-500">
                {formatarMoeda(totalReceitas)}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                {receitas.length} lançamento
                {receitas.length === 1 ? "" : "s"}
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                Despesas do período
              </p>

              <p className="mt-2 text-2xl font-bold text-red-500">
                {formatarMoeda(totalDespesas)}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                {despesas.length} lançamento
                {despesas.length === 1 ? "" : "s"}
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                Saldo do período
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  saldo >= 0 ? "text-white" : "text-red-500"
                }`}
              >
                {formatarMoeda(saldo)}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Receitas menos despesas
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <p className="text-sm text-zinc-400">
                Taxa de economia
              </p>

              <p
                className={`mt-2 text-2xl font-bold ${
                  economiaPercentual >= 0
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {economiaPercentual.toFixed(1)}%
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                Percentual da receita preservado
              </p>
            </article>
          </section>

          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-7">
              <h2 className="text-xl font-semibold">
                Movimentação diária
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Receitas e despesas por dia do mês
              </p>
            </div>

            <GraficoRelatorio dados={dadosGrafico} />
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:col-span-2">
              <h2 className="text-xl font-semibold">
                Despesas por categoria
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Categorias com maior participação nos gastos
              </p>

              {categoriasOrdenadas.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                  <p className="text-zinc-300">
                    Nenhuma despesa no período.
                  </p>
                </div>
              ) : (
                <div className="mt-7 space-y-5">
                  {categoriasOrdenadas.map((item) => (
                    <div key={item.categoria}>
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">
                            {item.categoria}
                          </p>

                          <p className="mt-1 text-sm text-zinc-500">
                            {item.percentual.toFixed(1)}% das despesas
                          </p>
                        </div>

                        <p className="font-bold text-red-500">
                          {formatarMoeda(item.valor)}
                        </p>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-red-600"
                          style={{
                            width: `${Math.min(
                              item.percentual,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <h2 className="text-xl font-semibold">
                Destaques do período
              </h2>

              <div className="mt-7 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-500">
                    Maior receita
                  </p>

                  {maiorReceita ? (
                    <>
                      <p className="mt-2 font-semibold">
                        {maiorReceita.descricao}
                      </p>

                      <p className="mt-1 text-lg font-bold text-emerald-500">
                        {formatarMoeda(
                          Number(maiorReceita.valor)
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-600">
                      Nenhuma receita
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-500">
                    Maior despesa
                  </p>

                  {maiorDespesa ? (
                    <>
                      <p className="mt-2 font-semibold">
                        {maiorDespesa.descricao}
                      </p>

                      <p className="mt-1 text-lg font-bold text-red-500">
                        {formatarMoeda(
                          Number(maiorDespesa.valor)
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-zinc-600">
                      Nenhuma despesa
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-800 bg-black p-4">
                  <p className="text-sm text-zinc-500">
                    Total de movimentações
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {movimentacoes.length}
                  </p>
                </div>
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div>
              <h2 className="text-xl font-semibold">
                Todas as movimentações
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Histórico completo do período selecionado
              </p>
            </div>

            {movimentacoes.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                <p className="text-zinc-300">
                  Nenhuma movimentação encontrada.
                </p>
              </div>
            ) : (
              <div className="mt-7 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-sm text-zinc-500">
                      <th className="px-4 py-3 font-medium">
                        Data
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Descrição
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Categoria
                      </th>

                      <th className="px-4 py-3 font-medium">
                        Tipo
                      </th>

                      <th className="px-4 py-3 text-right font-medium">
                        Valor
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimentacoes.map((movimentacao) => {
                      const receita =
                        movimentacao.tipo === "receita";

                      return (
                        <tr
                          key={movimentacao.id}
                          className="border-b border-zinc-900 text-sm last:border-0"
                        >
                          <td className="px-4 py-4 text-zinc-400">
                            {formatarData(movimentacao.data)}
                          </td>

                          <td className="px-4 py-4">
                            <p className="font-medium">
                              {movimentacao.descricao}
                            </p>

                            {movimentacao.observacao && (
                              <p className="mt-1 max-w-xs truncate text-xs text-zinc-600">
                                {movimentacao.observacao}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-4 text-zinc-400">
                            {movimentacao.categoria}
                          </td>

                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                receita
                                  ? "bg-emerald-950 text-emerald-400"
                                  : "bg-red-950 text-red-400"
                              }`}
                            >
                              {receita ? "Receita" : "Despesa"}
                            </span>
                          </td>

                          <td
                            className={`px-4 py-4 text-right font-bold ${
                              receita
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                          >
                            {receita ? "+" : "-"}{" "}
                            {formatarMoeda(
                              Number(movimentacao.valor)
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
  );
}