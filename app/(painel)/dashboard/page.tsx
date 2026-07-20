import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import GraficoFinanceiro from "@/components/grafico-financeiro";
import OrcamentoMensal from "@/components/orcamento-mensal";
import GraficoCategorias from "@/components/grafico-categorias";

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

type MenuItemProps = {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
};

function MenuItem({
  icon,
  label,
  href,
  active = false,
}: MenuItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-red-600 text-white"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

type CardResumoProps = {
  titulo: string;
  valor: string;
  descricao: string;
  icon: string;
  destaque?: "verde" | "vermelho" | "branco";
};

function CardResumo({
  titulo,
  valor,
  descricao,
  icon,
  destaque = "branco",
}: CardResumoProps) {
  const corValor = {
    verde: "text-emerald-500",
    vermelho: "text-red-500",
    branco: "text-white",
  };

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">{titulo}</p>

          <p className={`mt-2 text-2xl font-bold ${corValor[destaque]}`}>
            {valor}
          </p>

          <p className="mt-2 text-xs text-zinc-500">{descricao}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 text-xl">
          {icon}
        </div>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nome =
    typeof user.user_metadata?.nome === "string"
      ? user.user_metadata.nome
      : "Usuário";

  const { data, error } = await supabase
    .from("movimentacoes")
    .select(
      "id, tipo, descricao, categoria, valor, data, observacao, created_at"
    )
    .eq("user_id", user.id)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar movimentações:", error);
  }

  const movimentacoes = (data ?? []) as Movimentacao[];

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtualNumero = String(hoje.getMonth() + 1).padStart(2, "0");
  const mesAtual = `${anoAtual}-${mesAtualNumero}`;

  const movimentacoesDoMes = movimentacoes.filter((movimentacao) =>
    movimentacao.data.startsWith(mesAtual)
  );

  const totalReceitas = movimentacoes
    .filter((movimentacao) => movimentacao.tipo === "receita")
    .reduce(
      (total, movimentacao) => total + Number(movimentacao.valor),
      0
    );

  const totalDespesas = movimentacoes
    .filter((movimentacao) => movimentacao.tipo === "despesa")
    .reduce(
      (total, movimentacao) => total + Number(movimentacao.valor),
      0
    );

  const receitasDoMes = movimentacoesDoMes
    .filter((movimentacao) => movimentacao.tipo === "receita")
    .reduce(
      (total, movimentacao) => total + Number(movimentacao.valor),
      0
    );

  const despesasDoMes = movimentacoesDoMes
    .filter((movimentacao) => movimentacao.tipo === "despesa")
    .reduce(
      (total, movimentacao) => total + Number(movimentacao.valor),
      0
    );

  const saldoAtual = totalReceitas - totalDespesas;
  const economiaMensal = receitasDoMes - despesasDoMes;

  const ultimasMovimentacoes = movimentacoes.slice(0, 5);
    const despesasMesAtual = movimentacoesDoMes.filter(
    (movimentacao) => movimentacao.tipo === "despesa"
  );

  const categoriasAgrupadas = despesasMesAtual.reduce<
    Record<string, number>
  >((resultado, movimentacao) => {
    const categoria = movimentacao.categoria || "Outros";
    const valor = Number(movimentacao.valor);

    resultado[categoria] =
      (resultado[categoria] ?? 0) + valor;

    return resultado;
  }, {});

  const dadosCategorias = Object.entries(categoriasAgrupadas)
    .map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual:
        despesasDoMes > 0
          ? (valor / despesasDoMes) * 100
          : 0,
    }))
    .sort((categoriaA, categoriaB) => {
      return categoriaB.valor - categoriaA.valor;
    });

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("limite")
    .eq("user_id", user.id)
    .eq("ano_mes", mesAtual)
    .maybeSingle();

  const limiteOrcamento = Number(orcamento?.limite ?? 0);
  const nomesMeses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const dadosGrafico = Array.from({ length: 6 }, (_, indice) => {
    const dataReferencia = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - (5 - indice),
      1
    );

    const ano = dataReferencia.getFullYear();
    const mesNumero = dataReferencia.getMonth();
    const mesBanco = `${ano}-${String(mesNumero + 1).padStart(
      2,
      "0"
    )}`;

    const movimentacoesDoPeriodo = movimentacoes.filter(
      (movimentacao) => movimentacao.data.startsWith(mesBanco)
    );

    const receitas = movimentacoesDoPeriodo
      .filter((movimentacao) => movimentacao.tipo === "receita")
      .reduce(
        (total, movimentacao) =>
          total + Number(movimentacao.valor),
        0
      );

    const despesas = movimentacoesDoPeriodo
      .filter((movimentacao) => movimentacao.tipo === "despesa")
      .reduce(
        (total, movimentacao) =>
          total + Number(movimentacao.valor),
        0
      );

    return {
      mes: nomesMeses[mesNumero],
      receitas,
      despesas,
    };
  });
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        {/* Menu lateral */}
        
        {/* Conteúdo principal */}
        <div className="min-w-0 flex-1">
          {/* Cabeçalho */}
          <header className="sticky top-0 z-20 border-b border-zinc-800 bg-black/90 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-red-600 lg:hidden">
                  FinControl
                </h1>

                <p className="hidden text-sm text-zinc-500 lg:block">
                  Visão geral das suas finanças
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold">{nome}</p>
                  <p className="text-xs text-zinc-500">
                    {user.email}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 font-bold">
                  {nome.charAt(0).toUpperCase()}
                </div>

                <LogoutButton />
              </div>
            </div>
          </header>

          <section className="px-4 py-6 md:px-8 md:py-8">
            {/* Boas-vindas */}
            <div className="mb-8">
              <p className="text-sm text-zinc-500">
                Bem-vindo de volta,
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                Olá, {nome}!
              </h2>

              <p className="mt-2 text-sm text-zinc-400">
                Acompanhe o resumo da sua vida financeira.
              </p>
            </div>

            {/* Cards principais */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <CardResumo
                titulo="Saldo atual"
                valor={formatarMoeda(saldoAtual)}
                descricao="Receitas menos despesas"
                icon="◈"
              />

              <CardResumo
                titulo="Receitas do mês"
                valor={formatarMoeda(receitasDoMes)}
                descricao="Total recebido neste mês"
                icon="↗"
                destaque="verde"
              />

              <CardResumo
                titulo="Despesas do mês"
                valor={formatarMoeda(despesasDoMes)}
                descricao="Total gasto neste mês"
                icon="↘"
                destaque="vermelho"
              />

              <CardResumo
                titulo="Economia mensal"
                valor={formatarMoeda(economiaMensal)}
                descricao={
                  economiaMensal >= 0
                    ? "Valor economizado no mês"
                    : "Despesas maiores que as receitas"
                }
                icon="◎"
                destaque={
                  economiaMensal < 0 ? "vermelho" : "branco"
                }
              />
            </div>

            {/* Gráfico e orçamento */}
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 xl:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Evolução financeira
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      Receitas e despesas dos últimos meses
                    </p>
                  </div>

                  <select className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none">
                    <option>6 meses</option>
                    <option>12 meses</option>
                  </select>
                </div>

                <GraficoFinanceiro dados={dadosGrafico} />
              </article>

              <OrcamentoMensal
                userId={user.id}
                anoMes={mesAtual}
                limiteInicial={limiteOrcamento}
                despesasDoMes={despesasDoMes}
              />
            </div>

           {/* Movimentações e categorias */}
<div className="mt-6 grid gap-6 xl:grid-cols-3">
  <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 xl:col-span-2">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">
          Últimas movimentações
        </h3>

        <p className="mt-1 text-sm text-zinc-500">
          Receitas e despesas recentes
        </p>
      </div>

      <Link
        href="/receitas"
        className="text-sm font-medium text-red-500 hover:text-red-400"
      >
        Ver todas
      </Link>
    </div>

    {ultimasMovimentacoes.length === 0 ? (
      <div className="mt-8 flex min-h-48 items-center justify-center rounded-xl border border-dashed border-zinc-800">
        <div className="text-center">
          <p className="text-3xl">↕</p>

          <p className="mt-3 font-medium text-zinc-300">
            Nenhuma movimentação
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Seus lançamentos aparecerão aqui
          </p>
        </div>
      </div>
    ) : (
      <div className="mt-6 space-y-3">
        {ultimasMovimentacoes.map((movimentacao) => {
          const receita = movimentacao.tipo === "receita";

          return (
            <div
              key={movimentacao.id}
              className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-black p-4 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    receita
                      ? "bg-emerald-950 text-emerald-500"
                      : "bg-red-950 text-red-500"
                  }`}
                >
                  {receita ? "↗" : "↘"}
                </div>

                <div>
                  <p className="font-semibold">
                    {movimentacao.descricao}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    {movimentacao.categoria} ·{" "}
                    {new Date(
                      `${movimentacao.data}T12:00:00`
                    ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>

              <p
                className={`font-bold ${
                  receita
                    ? "text-emerald-500"
                    : "text-red-500"
                }`}
              >
                {receita ? "+" : "-"}{" "}
                {formatarMoeda(Number(movimentacao.valor))}
              </p>
            </div>
          );
        })}
      </div>
    )}
  </article>

  <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
    <h3 className="text-lg font-semibold">
      Gastos por categoria
    </h3>

    <p className="mt-1 text-sm text-zinc-500">
      Distribuição das despesas deste mês
    </p>

    <GraficoCategorias dados={dadosCategorias} />
  </article>
</div>
            {/* Ações rápidas */}
            <article className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
              <h3 className="text-lg font-semibold">
                Ações rápidas
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/receitas"
                  className="rounded-xl bg-emerald-600 px-4 py-4 text-center font-semibold transition hover:bg-emerald-700"
                >
                  + Adicionar receita
                </Link>

                <Link
                  href="/despesas"
                  className="rounded-xl bg-red-600 px-4 py-4 text-center font-semibold transition hover:bg-red-700"
                >
                  + Adicionar despesa
                </Link>

                <button className="rounded-xl border border-zinc-700 px-4 py-4 font-semibold transition hover:border-red-600">
                  Criar meta
                </button>

                <button className="rounded-xl border border-zinc-700 px-4 py-4 font-semibold transition hover:border-red-600">
                  Ver relatório
                </button>
              </div>
            </article>
          </section>

          {/* Navegação mobile */}
          <nav className="sticky bottom-0 z-20 grid grid-cols-4 border-t border-zinc-800 bg-zinc-950 px-2 py-2 lg:hidden">
            <Link
              href="/dashboard"
              className="rounded-lg bg-red-600 px-2 py-2 text-center text-xs font-semibold"
            >
              <span className="block text-lg">⌂</span>
              Início
            </Link>

            <Link
              href="/receitas"
              className="px-2 py-2 text-center text-xs text-zinc-400"
            >
              <span className="block text-lg">↗</span>
              Receitas
            </Link>

            <Link
              href="/despesas"
              className="px-2 py-2 text-center text-xs text-zinc-400"
            >
              <span className="block text-lg">↘</span>
              Despesas
            </Link>

            <Link
              href="/configuracoes"
              className="px-2 py-2 text-center text-xs text-zinc-400"
            >
              <span className="block text-lg">•••</span>
              Mais
            </Link>
          </nav>
        </div>
      </div>
    </main>
  );
}