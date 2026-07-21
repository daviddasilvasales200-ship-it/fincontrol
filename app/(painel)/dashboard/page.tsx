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

type DestaqueCard = "verde" | "vermelho" | "azul" | "amarelo" | "branco";

type CardResumoProps = {
  titulo: string;
  valor: string;
  descricao: string;
  icone: string;
  destaque?: DestaqueCard;
  variacao?: number | null;
  valorAtual?: number;
  valorAnterior?: number;
  inverterVariacao?: boolean;
};

type AlertaFinanceiro = {
  tipo: "sucesso" | "alerta" | "perigo" | "informacao";
  titulo: string;
  descricao: string;
  icone: string;
};

type ClaimsPersonalizados = {
  sub?: string;
  email?: string;
  user_metadata?: {
    nome?: string;
    avatar?: string;
    avatar_url?: string;
  };
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarPercentual(valor: number) {
  return Math.abs(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}

function calcularVariacao(
  atual: number,
  anterior: number
): number | null {
  if (anterior === 0) {
    return null;
  }

  return ((atual - anterior) / anterior) * 100;
}

function obterSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) {
    return "Bom dia";
  }

  if (hora < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

function obterNomeMes(data: Date) {
  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function obterCorSaudeFinanceira(pontuacao: number) {
  if (pontuacao >= 80) {
    return {
      texto: "Excelente",
      textoClasse: "text-emerald-400",
      barraClasse: "bg-emerald-500",
      fundoClasse: "bg-emerald-500/10",
      bordaClasse: "border-emerald-500/20",
    };
  }

  if (pontuacao >= 60) {
    return {
      texto: "Boa",
      textoClasse: "text-blue-400",
      barraClasse: "bg-blue-500",
      fundoClasse: "bg-blue-500/10",
      bordaClasse: "border-blue-500/20",
    };
  }

  if (pontuacao >= 40) {
    return {
      texto: "Atenção",
      textoClasse: "text-amber-400",
      barraClasse: "bg-amber-500",
      fundoClasse: "bg-amber-500/10",
      bordaClasse: "border-amber-500/20",
    };
  }

  return {
    texto: "Crítica",
    textoClasse: "text-red-400",
    barraClasse: "bg-red-500",
    fundoClasse: "bg-red-500/10",
    bordaClasse: "border-red-500/20",
  };
}

function CardResumo({
  titulo,
  valor,
  descricao,
  icone,
  destaque = "branco",
  variacao = null,
  valorAtual = 0,
  valorAnterior = 0,
  inverterVariacao = false,
}: CardResumoProps) {
  const estilos = {
    verde: {
      valor: "text-emerald-400",
      icone: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
      brilho: "group-hover:border-emerald-500/30",
    },
    vermelho: {
      valor: "text-red-400",
      icone: "bg-red-500/10 text-red-400 ring-red-500/20",
      brilho: "group-hover:border-red-500/30",
    },
    azul: {
      valor: "text-blue-400",
      icone: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
      brilho: "group-hover:border-blue-500/30",
    },
    amarelo: {
      valor: "text-amber-400",
      icone: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
      brilho: "group-hover:border-amber-500/30",
    },
    branco: {
      valor: "text-white",
      icone: "bg-zinc-800 text-white ring-zinc-700",
      brilho: "group-hover:border-zinc-600",
    },
  };

  const estilo = estilos[destaque];
  const semValorAnterior = valorAnterior === 0;

  const textoSemComparacao =
    valorAtual > 0 ? "Novo neste mês" : "Sem movimentação";
  const variacaoPositiva =
    variacao !== null &&
    (inverterVariacao ? variacao <= 0 : variacao >= 0);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/30 ${estilo.brilho}`}
    >
      <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/[0.025] blur-2xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-400">
            {titulo}
          </p>

          <p
            className={`mt-3 truncate text-2xl font-bold tracking-tight ${estilo.valor}`}
          >
            {valor}
          </p>

          {semValorAnterior ? (
  <div className="mt-3 flex flex-wrap items-center gap-2">
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        valorAtual > 0
          ? "bg-blue-500/10 text-blue-400"
          : "bg-zinc-800 text-zinc-400"
      }`}
    >
      {valorAtual > 0 ? "Novo" : "—"}
    </span>

    <span className="text-xs text-zinc-600">
      {textoSemComparacao}
    </span>
  </div>
) : variacao !== null ? (
  <div className="mt-3 flex flex-wrap items-center gap-2">
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        variacaoPositiva
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {variacao >= 0 ? "↑" : "↓"}{" "}
      {formatarPercentual(variacao)}%
    </span>

    <span className="text-xs text-zinc-600">
      mês anterior
    </span>
  </div>
) : (
  <p className="mt-3 text-xs text-zinc-500">
    {descricao}
  </p>
)}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ${estilo.icone}`}
        >
          <span aria-hidden="true">{icone}</span>
        </div>
      </div>
    </article>
  );
}

function AlertaCard({ alerta }: { alerta: AlertaFinanceiro }) {
  const estilos = {
    sucesso: {
      container: "border-emerald-500/20 bg-emerald-500/[0.07]",
      icone: "bg-emerald-500/15 text-emerald-400",
    },
    alerta: {
      container: "border-amber-500/20 bg-amber-500/[0.07]",
      icone: "bg-amber-500/15 text-amber-400",
    },
    perigo: {
      container: "border-red-500/20 bg-red-500/[0.07]",
      icone: "bg-red-500/15 text-red-400",
    },
    informacao: {
      container: "border-blue-500/20 bg-blue-500/[0.07]",
      icone: "bg-blue-500/15 text-blue-400",
    },
  };

  const estilo = estilos[alerta.tipo];

  return (
    <article
      className={`flex gap-3 rounded-2xl border p-4 ${estilo.container}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${estilo.icone}`}
      >
        <span aria-hidden="true">{alerta.icone}</span>
      </div>

      <div className="min-w-0">
        <p className="text-sm font-semibold text-zinc-100">
          {alerta.titulo}
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-400">
          {alerta.descricao}
        </p>
      </div>
    </article>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const claims = claimsData?.claims as ClaimsPersonalizados | undefined;
  const userId = claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const nomeCompleto =
    typeof claims.user_metadata?.nome === "string" &&
    claims.user_metadata.nome.trim()
      ? claims.user_metadata.nome.trim()
      : "Usuário";

  const primeiroNome = nomeCompleto.split(" ")[0];
  const email =
    typeof claims.email === "string" ? claims.email : "";

  const avatarUrl =
    typeof claims.user_metadata?.avatar_url === "string"
      ? claims.user_metadata.avatar_url
      : typeof claims.user_metadata?.avatar === "string"
        ? claims.user_metadata.avatar
        : "";

  const hoje = new Date();

  const anoAtual = hoje.getFullYear();
  const mesAtualNumero = String(hoje.getMonth() + 1).padStart(2, "0");
  const mesAtual = `${anoAtual}-${mesAtualNumero}`;

  const dataMesAnterior = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 1,
    1
  );

  const mesAnterior = `${dataMesAnterior.getFullYear()}-${String(
    dataMesAnterior.getMonth() + 1
  ).padStart(2, "0")}`;

  const dataInicioGrafico = new Date(
    hoje.getFullYear(),
    hoje.getMonth() - 5,
    1
  );

  const dataInicioConsulta = `${dataInicioGrafico.getFullYear()}-${String(
    dataInicioGrafico.getMonth() + 1
  ).padStart(2, "0")}-01`;

  const [resultadoMovimentacoes, resultadoOrcamento] = await Promise.all([
    supabase
      .from("movimentacoes")
      .select(
        "id, tipo, descricao, categoria, valor, data, observacao, created_at"
      )
      .eq("user_id", userId)
      .gte("data", dataInicioConsulta)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false }),

    supabase
      .from("orcamentos")
      .select("limite")
      .eq("user_id", userId)
      .eq("ano_mes", mesAtual)
      .maybeSingle(),
  ]);

  const erroMovimentacoes = resultadoMovimentacoes.error;
  const erroOrcamento = resultadoOrcamento.error;

  if (erroMovimentacoes) {
    console.error(
      "Erro ao buscar movimentações:",
      erroMovimentacoes
    );
  }

  if (erroOrcamento) {
    console.error("Erro ao buscar orçamento:", erroOrcamento);
  }

  const movimentacoes =
    (resultadoMovimentacoes.data ?? []) as Movimentacao[];

  const limiteOrcamento = Number(
    resultadoOrcamento.data?.limite ?? 0
  );

  const movimentacoesDoMes = movimentacoes.filter((movimentacao) =>
    movimentacao.data.startsWith(mesAtual)
  );

  const movimentacoesMesAnterior = movimentacoes.filter(
    (movimentacao) => movimentacao.data.startsWith(mesAnterior)
  );

  const totalReceitasPeriodo = movimentacoes
    .filter((movimentacao) => movimentacao.tipo === "receita")
    .reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.valor),
      0
    );

  const totalDespesasPeriodo = movimentacoes
    .filter((movimentacao) => movimentacao.tipo === "despesa")
    .reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.valor),
      0
    );

  const receitasDoMes = movimentacoesDoMes
    .filter((movimentacao) => movimentacao.tipo === "receita")
    .reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.valor),
      0
    );

  const despesasDoMes = movimentacoesDoMes
    .filter((movimentacao) => movimentacao.tipo === "despesa")
    .reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.valor),
      0
    );

  const receitasMesAnterior = movimentacoesMesAnterior
    .filter((movimentacao) => movimentacao.tipo === "receita")
    .reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.valor),
      0
    );

  const despesasMesAnterior = movimentacoesMesAnterior
    .filter((movimentacao) => movimentacao.tipo === "despesa")
    .reduce(
      (total, movimentacao) =>
        total + Number(movimentacao.valor),
      0
    );

  const resultadoMensal = receitasDoMes - despesasDoMes;
  const resultadoMesAnterior =
    receitasMesAnterior - despesasMesAnterior;

  /*
   * Este saldo representa o período carregado pelo dashboard.
   * Como a consulta busca os últimos seis meses, o card mostra
   * o saldo acumulado desse período.
   */
  const saldoPeriodo =
    totalReceitasPeriodo - totalDespesasPeriodo;

  const variacaoReceitas = calcularVariacao(
    receitasDoMes,
    receitasMesAnterior
  );

  const variacaoDespesas = calcularVariacao(
    despesasDoMes,
    despesasMesAnterior
  );

  const variacaoResultado = calcularVariacao(
    resultadoMensal,
    resultadoMesAnterior
  );

  const percentualComprometido =
    receitasDoMes > 0
      ? (despesasDoMes / receitasDoMes) * 100
      : despesasDoMes > 0
        ? 100
        : 0;

  const percentualOrcamento =
    limiteOrcamento > 0
      ? (despesasDoMes / limiteOrcamento) * 100
      : 0;

  let pontuacaoSaude = 50;

  if (receitasDoMes > 0) {
    pontuacaoSaude = 100 - percentualComprometido;
  } else if (despesasDoMes === 0) {
    pontuacaoSaude = 70;
  } else {
    pontuacaoSaude = 10;
  }

  if (
    limiteOrcamento > 0 &&
    percentualOrcamento > 100
  ) {
    pontuacaoSaude -= 15;
  }

  if (
    despesasMesAnterior > 0 &&
    despesasDoMes < despesasMesAnterior
  ) {
    pontuacaoSaude += 10;
  }

  pontuacaoSaude = Math.max(
    0,
    Math.min(100, Math.round(pontuacaoSaude))
  );

  const saudeFinanceira =
    obterCorSaudeFinanceira(pontuacaoSaude);

  const despesasMesAtual = movimentacoesDoMes.filter(
    (movimentacao) => movimentacao.tipo === "despesa"
  );

  const categoriasAgrupadas = despesasMesAtual.reduce<
    Record<string, number>
  >((resultado, movimentacao) => {
    const categoria =
      movimentacao.categoria?.trim() || "Outros";

    resultado[categoria] =
      (resultado[categoria] ?? 0) +
      Number(movimentacao.valor);

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
    .sort(
      (categoriaA, categoriaB) =>
        categoriaB.valor - categoriaA.valor
    );

  const maiorCategoria = dadosCategorias[0] ?? null;
  const ultimasMovimentacoes = movimentacoes.slice(0, 5);

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

  const dadosGrafico = Array.from(
    { length: 6 },
    (_, indice) => {
      const dataReferencia = new Date(
        hoje.getFullYear(),
        hoje.getMonth() - (5 - indice),
        1
      );

      const ano = dataReferencia.getFullYear();
      const mesNumero = dataReferencia.getMonth();

      const mesBanco = `${ano}-${String(
        mesNumero + 1
      ).padStart(2, "0")}`;

      const movimentacoesDoPeriodo = movimentacoes.filter(
        (movimentacao) =>
          movimentacao.data.startsWith(mesBanco)
      );

      const receitas = movimentacoesDoPeriodo
        .filter(
          (movimentacao) =>
            movimentacao.tipo === "receita"
        )
        .reduce(
          (total, movimentacao) =>
            total + Number(movimentacao.valor),
          0
        );

      const despesas = movimentacoesDoPeriodo
        .filter(
          (movimentacao) =>
            movimentacao.tipo === "despesa"
        )
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
    }
  );

  const alertas: AlertaFinanceiro[] = [];

  if (limiteOrcamento <= 0) {
    alertas.push({
      tipo: "informacao",
      titulo: "Defina seu orçamento",
      descricao:
        "Cadastre um limite mensal para acompanhar melhor os seus gastos.",
      icone: "◎",
    });
  } else if (percentualOrcamento >= 100) {
    alertas.push({
      tipo: "perigo",
      titulo: "Orçamento ultrapassado",
      descricao: `Você utilizou ${formatarPercentual(
        percentualOrcamento
      )}% do limite definido para este mês.`,
      icone: "!",
    });
  } else if (percentualOrcamento >= 80) {
    alertas.push({
      tipo: "alerta",
      titulo: "Atenção ao orçamento",
      descricao: `Você já utilizou ${formatarPercentual(
        percentualOrcamento
      )}% do limite mensal.`,
      icone: "!",
    });
  } else {
    alertas.push({
      tipo: "sucesso",
      titulo: "Orçamento sob controle",
      descricao: `Você utilizou ${formatarPercentual(
        percentualOrcamento
      )}% do limite mensal.`,
      icone: "✓",
    });
  }

  if (
    despesasMesAnterior > 0 &&
    despesasDoMes < despesasMesAnterior
  ) {
    alertas.push({
      tipo: "sucesso",
      titulo: "Despesas diminuíram",
      descricao: `Seus gastos caíram ${formatarPercentual(
        Math.abs(variacaoDespesas)
      )}% em comparação ao mês anterior.`,
      icone: "↓",
    });
  } else if (
    despesasMesAnterior > 0 &&
    despesasDoMes > despesasMesAnterior
  ) {
    alertas.push({
      tipo: "alerta",
      titulo: "Despesas aumentaram",
      descricao: `Seus gastos cresceram ${formatarPercentual(
        variacaoDespesas
      )}% em comparação ao mês anterior.`,
      icone: "↑",
    });
  }

  if (maiorCategoria) {
    alertas.push({
      tipo: "informacao",
      titulo: "Maior categoria de gastos",
      descricao: `${maiorCategoria.categoria} representa ${formatarPercentual(
        maiorCategoria.percentual
      )}% das despesas deste mês.`,
      icone: "◆",
    });
  }

  const alertasVisiveis = alertas.slice(0, 3);

  let insightPrincipal =
    "Cadastre suas receitas e despesas para receber análises financeiras.";

  if (movimentacoesDoMes.length > 0) {
    if (resultadoMensal > 0) {
      insightPrincipal = `Você terminou o mês com resultado positivo de ${formatarMoeda(
        resultadoMensal
      )}. Continue mantendo as despesas abaixo das receitas.`;
    } else if (resultadoMensal < 0) {
      insightPrincipal = `Suas despesas ultrapassaram as receitas em ${formatarMoeda(
        Math.abs(resultadoMensal)
      )}. Revise os gastos que podem ser reduzidos.`;
    } else {
      insightPrincipal =
        "Suas receitas e despesas estão equilibradas neste mês. Busque criar uma margem para economia.";
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-black/85 px-4 py-4 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-500">
              Dashboard Premium
            </p>

            <p className="mt-1 hidden text-sm text-zinc-500 sm:block">
              Visão geral das suas finanças
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-44 truncate text-sm font-semibold">
                {nomeCompleto}
              </p>

              {email && (
                <p className="max-w-44 truncate text-xs text-zinc-500">
                  {email}
                </p>
              )}
            </div>

            {avatarUrl ? (
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt={`Avatar de ${nomeCompleto}`}
                  className="h-11 w-11 rounded-full border-2 border-red-500/70 object-cover ring-4 ring-red-500/10"
                />

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black bg-emerald-500" />
              </div>
            ) : (
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-800 font-bold ring-4 ring-red-500/10">
                {nomeCompleto.charAt(0).toUpperCase()}

                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-black bg-emerald-500" />
              </div>
            )}

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
        {erroMovimentacoes && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            Não foi possível carregar todas as movimentações.
            Atualize a página e tente novamente.
          </div>
        )}

        <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm text-zinc-500">
              {obterSaudacao()},
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              {primeiroNome}
              <span className="ml-2">👋</span>
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Veja como estão suas finanças em{" "}
              <span className="font-medium text-zinc-200">
                {obterNomeMes(hoje)}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/receitas"
              className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold transition hover:bg-emerald-500"
            >
              + Nova receita
            </Link>

            <Link
              href="/despesas"
              className="rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-500"
            >
              + Nova despesa
            </Link>
          </div>
        </div>

        {/* Cartão principal */}
        <article className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/50 p-6 shadow-2xl shadow-red-950/10 md:p-8">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-red-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500" />

                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                    Saldo dos últimos 6 meses
                  </p>
                </div>

                <p
                  className={`mt-4 text-4xl font-bold tracking-tight sm:text-5xl ${
                    saldoPeriodo >= 0
                      ? "text-white"
                      : "text-red-400"
                  }`}
                >
                  {formatarMoeda(saldoPeriodo)}
                </p>

                <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                  Resultado acumulado das receitas e despesas
                  carregadas no período apresentado pelo
                  dashboard.
                </p>
              </div>

              <div
                className={`w-full rounded-2xl border p-4 lg:max-w-sm ${saudeFinanceira.fundoClasse} ${saudeFinanceira.bordaClasse}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-zinc-500">
                      Saúde financeira
                    </p>

                    <p
                      className={`mt-1 text-lg font-bold ${saudeFinanceira.textoClasse}`}
                    >
                      {saudeFinanceira.texto}
                    </p>
                  </div>

                  <p className="text-2xl font-bold">
                    {pontuacaoSaude}
                    <span className="text-sm text-zinc-500">
                      /100
                    </span>
                  </p>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/40">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${saudeFinanceira.barraClasse}`}
                    style={{
                      width: `${pontuacaoSaude}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-xs leading-5 text-zinc-400">
                  {resultadoMensal >= 0
                    ? "Você está mantendo as despesas dentro das receitas."
                    : "Neste mês, as despesas estão acima das receitas."}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Receitas no mês
                </p>

                <p className="mt-2 text-xl font-bold text-emerald-400">
                  {formatarMoeda(receitasDoMes)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Despesas no mês
                </p>

                <p className="mt-2 text-xl font-bold text-red-400">
                  {formatarMoeda(despesasDoMes)}
                </p>
              </div>

              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">
                  Resultado mensal
                </p>

                <p
                  className={`mt-2 text-xl font-bold ${
                    resultadoMensal >= 0
                      ? "text-blue-400"
                      : "text-red-400"
                  }`}
                >
                  {resultadoMensal >= 0 ? "+" : "-"}{" "}
                  {formatarMoeda(Math.abs(resultadoMensal))}
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Indicadores */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <CardResumo
  titulo="Receitas do mês"
  valor={formatarMoeda(receitasDoMes)}
  descricao="Total recebido neste mês"
  icone="↗"
  destaque="verde"
  variacao={variacaoReceitas}
  valorAtual={receitasDoMes}
  valorAnterior={receitasMesAnterior}
/>

          <CardResumo
  titulo="Despesas do mês"
  valor={formatarMoeda(despesasDoMes)}
  descricao="Total gasto neste mês"
  icone="↘"
  destaque="vermelho"
  variacao={variacaoDespesas}
  valorAtual={despesasDoMes}
  valorAnterior={despesasMesAnterior}
  inverterVariacao
/>

          <CardResumo
  titulo="Resultado mensal"
  valor={formatarMoeda(resultadoMensal)}
  descricao="Receitas menos despesas"
  icone="◈"
  destaque={
    resultadoMensal >= 0 ? "azul" : "vermelho"
  }
  variacao={variacaoResultado}
  valorAtual={resultadoMensal}
  valorAnterior={resultadoMesAnterior}
/>

          <CardResumo
            titulo="Renda comprometida"
            valor={`${formatarPercentual(
              percentualComprometido
            )}%`}
            descricao="Percentual da receita utilizado"
            icone="◎"
            destaque={
              percentualComprometido <= 70
                ? "verde"
                : percentualComprometido <= 90
                  ? "amarelo"
                  : "vermelho"
            }
          />
        </div>

        {/* Gráfico e orçamento */}
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6 xl:col-span-2">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                  Fluxo financeiro
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Evolução financeira
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Receitas e despesas dos últimos seis meses
                </p>
              </div>

              <span className="w-fit rounded-full border border-zinc-800 bg-black px-3 py-2 text-xs text-zinc-400">
                Últimos 6 meses
              </span>
            </div>

            <GraficoFinanceiro dados={dadosGrafico} />
          </article>

          <OrcamentoMensal
            userId={userId}
            anoMes={mesAtual}
            limiteInicial={limiteOrcamento}
            despesasDoMes={despesasDoMes}
          />
        </div>

        {/* Alertas e assistente */}
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6 xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                  Inteligência financeira
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Assistente FinControl
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Análise automática baseada nas suas
                  movimentações
                </p>
              </div>

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 text-xl shadow-lg shadow-red-950/40">
                ✦
              </div>
            </div>

            <div className="relative mt-6 overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/40 to-black p-5">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-500/10 blur-2xl" />

              <p className="relative text-sm leading-7 text-zinc-300">
                {insightPrincipal}
              </p>

              {maiorCategoria && (
                <p className="relative mt-3 text-sm leading-7 text-zinc-400">
                  Sua maior categoria de gastos foi{" "}
                  <strong className="text-white">
                    {maiorCategoria.categoria}
                  </strong>
                  , com{" "}
                  <strong className="text-red-400">
                    {formatarMoeda(maiorCategoria.valor)}
                  </strong>
                  .
                </p>
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
            <h2 className="text-lg font-semibold">
              Alertas inteligentes
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Pontos que merecem sua atenção
            </p>

            <div className="mt-5 space-y-3">
              {alertasVisiveis.map((alerta, indice) => (
                <AlertaCard
                  key={`${alerta.titulo}-${indice}`}
                  alerta={alerta}
                />
              ))}
            </div>
          </article>
        </div>

        {/* Movimentações e categorias */}
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6 xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                  Atividade recente
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  Últimas movimentações
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Receitas e despesas cadastradas recentemente
                </p>
              </div>

              <Link
                href="/relatorios"
                className="shrink-0 text-sm font-semibold text-red-500 transition hover:text-red-400"
              >
                Ver todas
              </Link>
            </div>

            {ultimasMovimentacoes.length === 0 ? (
              <div className="mt-6 flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-black/30">
                <div className="px-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 text-2xl">
                    ↕
                  </div>

                  <p className="mt-4 font-medium text-zinc-300">
                    Nenhuma movimentação
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    Seus lançamentos aparecerão aqui.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {ultimasMovimentacoes.map((movimentacao) => {
                  const receita =
                    movimentacao.tipo === "receita";

                  return (
                    <div
                      key={movimentacao.id}
                      className="group flex flex-col justify-between gap-3 rounded-2xl border border-zinc-800 bg-black/50 p-4 transition hover:border-zinc-700 hover:bg-black sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            receita
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {receita ? "↗" : "↘"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {movimentacao.descricao}
                          </p>

                          <p className="mt-1 truncate text-sm text-zinc-500">
                            {movimentacao.categoria} ·{" "}
                            {new Date(
                              `${movimentacao.data}T12:00:00`
                            ).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`shrink-0 font-bold ${
                          receita
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {receita ? "+" : "-"}{" "}
                        {formatarMoeda(
                          Number(movimentacao.valor)
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
              Distribuição
            </p>

            <h2 className="mt-2 text-xl font-semibold">
              Gastos por categoria
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Despesas registradas neste mês
            </p>

            <GraficoCategorias dados={dadosCategorias} />
          </article>
        </div>

        {/* Ações rápidas */}
        <article className="mt-6 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">
                Atalhos
              </p>

              <h2 className="mt-2 text-xl font-semibold">
                Ações rápidas
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Acesse as principais áreas do FinControl
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/receitas"
              className="group rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                ↗
              </div>

              <p className="mt-4 font-semibold">
                Adicionar receita
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Registre um novo ganho
              </p>
            </Link>

            <Link
              href="/despesas"
              className="group rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 transition hover:-translate-y-0.5 hover:border-red-500/40 hover:bg-red-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                ↘
              </div>

              <p className="mt-4 font-semibold">
                Adicionar despesa
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Registre um novo gasto
              </p>
            </Link>

            <Link
              href="/assinaturas"
              className="group rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] p-4 transition hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-blue-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                ◎
              </div>

              <p className="mt-4 font-semibold">
                Ver assinaturas
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Controle pagamentos recorrentes
              </p>
            </Link>

            <Link
              href="/relatorios"
              className="group rounded-2xl border border-amber-500/20 bg-amber-500/[0.07] p-4 transition hover:-translate-y-0.5 hover:border-amber-500/40 hover:bg-amber-500/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                ▤
              </div>

              <p className="mt-4 font-semibold">
                Abrir relatórios
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Analise seu histórico financeiro
              </p>
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}