"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  Aposta,
  OrigemAposta,
} from "@/types/aposta";

type GraficosApostasProps = {
  apostas: Aposta[];
  carregando?: boolean;
};

type Periodo = "30" | "90" | "todos";
type OrigemFiltro = "todas" | OrigemAposta;

const CORES = {
  ganha: "#10b981",
  perdida: "#f43f5e",
  anulada: "#71717a",
  pendente: "#f59e0b",
};

function numero(valor: unknown) {
  const resultado = Number(valor ?? 0);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero(valor));
}

function percentual(valor: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numero(valor))}%`;
}

function dataValida(valor: string | null | undefined) {
  if (!valor) return null;

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function dataAposta(aposta: Aposta) {
  return (
    dataValida(aposta.data_aposta) ??
    dataValida(aposta.created_at)
  );
}

function chaveDia(data: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(data);
}

function dataCurta(data: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(data);
}

function classeValor(valor: number) {
  if (valor > 0) return "text-emerald-400";
  if (valor < 0) return "text-rose-400";
  return "text-zinc-300";
}

function calcularSequencias(apostas: Aposta[]) {
  let atualGanhos = 0;
  let atualPerdas = 0;
  let maiorGanhos = 0;
  let maiorPerdas = 0;

  apostas.forEach((aposta) => {
    if (aposta.resultado === "ganha") {
      atualGanhos += 1;
      atualPerdas = 0;
      maiorGanhos = Math.max(maiorGanhos, atualGanhos);
      return;
    }

    if (aposta.resultado === "perdida") {
      atualPerdas += 1;
      atualGanhos = 0;
      maiorPerdas = Math.max(maiorPerdas, atualPerdas);
      return;
    }

    if (aposta.resultado === "anulada") {
      atualGanhos = 0;
      atualPerdas = 0;
    }
  });

  return { maiorGanhos, maiorPerdas };
}

function Card({
  titulo,
  valor,
  descricao,
  tipo = "neutro",
}: {
  titulo: string;
  valor: string;
  descricao: string;
  tipo?: "neutro" | "positivo" | "negativo" | "azul" | "amarelo";
}) {
  const estilos = {
    neutro: "border-zinc-800 bg-black text-white",
    positivo:
      "border-emerald-900/60 bg-emerald-950/20 text-emerald-400",
    negativo:
      "border-rose-900/60 bg-rose-950/20 text-rose-400",
    azul:
      "border-blue-900/60 bg-blue-950/20 text-blue-400",
    amarelo:
      "border-amber-900/60 bg-amber-950/20 text-amber-400",
  };

  return (
    <article className={`rounded-2xl border p-4 ${estilos[tipo]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
        {titulo}
      </p>
      <p className="mt-2 break-words text-2xl font-bold">{valor}</p>
      <p className="mt-1 text-xs text-zinc-500">{descricao}</p>
    </article>
  );
}

function TooltipCurva({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      data?: string;
      lucro?: number;
      acumulado?: number;
      quantidade?: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const dados = payload[0]?.payload;
  if (!dados) return null;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {dados.data}
      </p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-8">
          <span className="text-zinc-400">Resultado do dia</span>
          <strong className={classeValor(numero(dados.lucro))}>
            {moeda(numero(dados.lucro))}
          </strong>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-zinc-400">Acumulado</span>
          <strong className={classeValor(numero(dados.acumulado))}>
            {moeda(numero(dados.acumulado))}
          </strong>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-zinc-400">Apostas</span>
          <strong className="text-white">{numero(dados.quantidade)}</strong>
        </div>
      </div>
    </div>
  );
}

function TooltipBarra({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      nome?: string;
      lucro?: number;
      apostado?: number;
      roi?: number;
      ganhas?: number;
      perdidas?: number;
    };
  }>;
}) {
  if (!active || !payload?.length) return null;

  const dados = payload[0]?.payload;
  if (!dados) return null;

  return (
    <div className="min-w-56 rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl">
      <p className="font-semibold text-white">{dados.nome}</p>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between gap-8">
          <span className="text-zinc-400">Lucro/prejuízo</span>
          <strong className={classeValor(numero(dados.lucro))}>
            {moeda(numero(dados.lucro))}
          </strong>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-zinc-400">Apostado</span>
          <strong className="text-white">
            {moeda(numero(dados.apostado))}
          </strong>
        </div>
        <div className="flex justify-between gap-8">
          <span className="text-zinc-400">ROI</span>
          <strong className="text-blue-400">
            {percentual(numero(dados.roi))}
          </strong>
        </div>
        <div className="flex justify-between gap-8 border-t border-zinc-800 pt-2">
          <span className="text-zinc-400">Ganhas / perdidas</span>
          <strong className="text-white">
            {numero(dados.ganhas)} / {numero(dados.perdidas)}
          </strong>
        </div>
      </div>
    </div>
  );
}

function EstadoCarregando() {
  return (
    <div className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, indice) => (
          <div
            key={indice}
            className="h-32 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="h-[430px] animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />
        <div className="h-[430px] animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />
      </div>
    </div>
  );
}

export default function GraficosApostas({
  apostas,
  carregando = false,
}: GraficosApostasProps) {
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [origem, setOrigem] = useState<OrigemFiltro>("todas");

  const apostasFiltradas = useMemo(() => {
    const limite =
      periodo === "todos"
        ? null
        : new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate() - Number(periodo)
          );

    return apostas.filter((aposta) => {
      if (origem !== "todas" && aposta.origem !== origem) {
        return false;
      }

      if (!limite) return true;

      const data = dataAposta(aposta);
      return Boolean(data && data.getTime() >= limite.getTime());
    });
  }, [apostas, origem, periodo]);

  const apostasOrdenadas = useMemo(
    () =>
      apostasFiltradas
        .map((aposta) => ({
          aposta,
          data: dataAposta(aposta),
        }))
        .filter(
          (
            item
          ): item is {
            aposta: Aposta;
            data: Date;
          } => item.data !== null
        )
        .sort((a, b) => a.data.getTime() - b.data.getTime()),
    [apostasFiltradas]
  );

  const finalizadasOrdenadas = useMemo(
    () =>
      apostasOrdenadas.filter(
        ({ aposta }) => aposta.resultado !== "pendente"
      ),
    [apostasOrdenadas]
  );

  const resumo = useMemo(() => {
    const finalizadas = apostasFiltradas.filter(
      (aposta) => aposta.resultado !== "pendente"
    );

    const pendentes = apostasFiltradas.filter(
      (aposta) => aposta.resultado === "pendente"
    );

    const ganhas = apostasFiltradas.filter(
      (aposta) => aposta.resultado === "ganha"
    ).length;

    const perdidas = apostasFiltradas.filter(
      (aposta) => aposta.resultado === "perdida"
    ).length;

    const totalApostado = finalizadas.reduce(
      (total, aposta) => total + numero(aposta.valor_apostado),
      0
    );

    const lucro = finalizadas.reduce(
      (total, aposta) => total + numero(aposta.lucro_prejuizo),
      0
    );

    const valorPendente = pendentes.reduce(
      (total, aposta) => total + numero(aposta.valor_apostado),
      0
    );

    const decisoes = ganhas + perdidas;
    const taxaAcerto = decisoes > 0 ? (ganhas / decisoes) * 100 : 0;
    const roi = totalApostado > 0 ? (lucro / totalApostado) * 100 : 0;

    return {
      total: apostasFiltradas.length,
      finalizadas: finalizadas.length,
      pendentes: pendentes.length,
      totalApostado,
      lucro,
      valorPendente,
      taxaAcerto,
      roi,
      ...calcularSequencias(
        finalizadasOrdenadas.map((item) => item.aposta)
      ),
    };
  }, [apostasFiltradas, finalizadasOrdenadas]);

  const dadosCurva = useMemo(() => {
    const mapa = new Map<
      string,
      {
        data: Date;
        lucro: number;
        quantidade: number;
      }
    >();

    finalizadasOrdenadas.forEach(({ aposta, data }) => {
      const chave = chaveDia(data);
      const registro = mapa.get(chave) ?? {
        data,
        lucro: 0,
        quantidade: 0,
      };

      registro.lucro += numero(aposta.lucro_prejuizo);
      registro.quantidade += 1;
      mapa.set(chave, registro);
    });

    let acumulado = 0;

    return Array.from(mapa.values())
      .sort((a, b) => a.data.getTime() - b.data.getTime())
      .map((item) => {
        acumulado += item.lucro;

        return {
          data: dataCurta(item.data),
          lucro: Number(item.lucro.toFixed(2)),
          acumulado: Number(acumulado.toFixed(2)),
          quantidade: item.quantidade,
        };
      });
  }, [finalizadasOrdenadas]);

  const dadosResultados = useMemo(() => {
    const contagem = {
      ganha: 0,
      perdida: 0,
      anulada: 0,
      pendente: 0,
    };

    apostasFiltradas.forEach((aposta) => {
      contagem[aposta.resultado] += 1;
    });

    return [
      {
        nome: "Ganhas",
        valor: contagem.ganha,
        cor: CORES.ganha,
      },
      {
        nome: "Perdidas",
        valor: contagem.perdida,
        cor: CORES.perdida,
      },
      {
        nome: "Anuladas",
        valor: contagem.anulada,
        cor: CORES.anulada,
      },
      {
        nome: "Pendentes",
        valor: contagem.pendente,
        cor: CORES.pendente,
      },
    ].filter((item) => item.valor > 0);
  }, [apostasFiltradas]);

  const agrupar = (
    obterNome: (aposta: Aposta) => string
  ) => {
    const mapa = new Map<
      string,
      {
        nome: string;
        ganhas: number;
        perdidas: number;
        apostado: number;
        lucro: number;
      }
    >();

    apostasFiltradas.forEach((aposta) => {
      const nome = obterNome(aposta).trim() || "Não informado";

      const registro = mapa.get(nome) ?? {
        nome,
        ganhas: 0,
        perdidas: 0,
        apostado: 0,
        lucro: 0,
      };

      if (aposta.resultado === "ganha") registro.ganhas += 1;
      if (aposta.resultado === "perdida") registro.perdidas += 1;

      if (aposta.resultado !== "pendente") {
        registro.apostado += numero(aposta.valor_apostado);
        registro.lucro += numero(aposta.lucro_prejuizo);
      }

      mapa.set(nome, registro);
    });

    return Array.from(mapa.values()).map((item) => ({
      ...item,
      nomeCurto:
        item.nome.length > 18
          ? `${item.nome.slice(0, 17)}…`
          : item.nome,
      roi: item.apostado > 0 ? (item.lucro / item.apostado) * 100 : 0,
    }));
  };

  const dadosCasas = useMemo(
    () =>
      agrupar((aposta) => aposta.casa_aposta ?? "Não informada")
        .sort((a, b) => Math.abs(b.lucro) - Math.abs(a.lucro))
        .slice(0, 7),
    [apostasFiltradas]
  );

  const dadosOrigem = useMemo(
    () =>
      agrupar((aposta) =>
        aposta.origem === "dica"
          ? "Vindas de dicas"
          : "Manuais"
      ),
    [apostasFiltradas]
  );

  if (carregando) return <EstadoCarregando />;

  const saldoAcumulado = dadosCurva.at(-1)?.acumulado ?? 0;
  const corCurva = saldoAcumulado >= 0 ? "#10b981" : "#f43f5e";

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Análise financeira
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Desempenho real das apostas
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Lucro, ROI, resultados, casas de aposta e origem.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-black p-1">
            {(
              [
                ["todas", "Todas"],
                ["manual", "Manuais"],
                ["dica", "Dicas"],
              ] as const
            ).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setOrigem(valor)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  origem === valor
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-black p-1">
            {(
              [
                ["30", "30 dias"],
                ["90", "90 dias"],
                ["todos", "Tudo"],
              ] as const
            ).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setPeriodo(valor)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  periodo === valor
                    ? "bg-blue-600 text-white"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          titulo="Lucro / prejuízo"
          valor={moeda(resumo.lucro)}
          descricao={`${resumo.finalizadas} resultado(s) concluído(s)`}
          tipo={
            resumo.lucro > 0
              ? "positivo"
              : resumo.lucro < 0
                ? "negativo"
                : "neutro"
          }
        />
        <Card
          titulo="ROI real"
          valor={percentual(resumo.roi)}
          descricao={`Sobre ${moeda(resumo.totalApostado)} finalizados`}
          tipo={
            resumo.roi > 0
              ? "positivo"
              : resumo.roi < 0
                ? "negativo"
                : "neutro"
          }
        />
        <Card
          titulo="Taxa de acerto"
          valor={percentual(resumo.taxaAcerto)}
          descricao="Considera ganhas e perdidas"
          tipo="azul"
        />
        <Card
          titulo="Valor pendente"
          valor={moeda(resumo.valorPendente)}
          descricao={`${resumo.pendentes} aposta(s) aguardando`}
          tipo={resumo.pendentes > 0 ? "amarelo" : "neutro"}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          titulo="Sequência positiva"
          valor={`${resumo.maiorGanhos}`}
          descricao="Maior série de apostas ganhas"
          tipo="positivo"
        />
        <Card
          titulo="Sequência negativa"
          valor={`${resumo.maiorPerdas}`}
          descricao="Maior série de apostas perdidas"
          tipo="negativo"
        />
        <Card
          titulo="Apostas analisadas"
          valor={`${resumo.total}`}
          descricao="Total no filtro atual"
        />
        <Card
          titulo="Resultados concluídos"
          valor={`${resumo.finalizadas}`}
          descricao="Ganhas, perdidas e anuladas"
          tipo="azul"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5 sm:p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Curva financeira
              </p>
              <h3 className="mt-2 text-lg font-bold text-white">
                Lucro real acumulado
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Resultados agrupados por dia.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wider text-zinc-600">
                Saldo
              </p>
              <p className={`mt-1 text-xl font-bold ${classeValor(saldoAcumulado)}`}>
                {moeda(saldoAcumulado)}
              </p>
            </div>
          </div>

          <div className="h-[360px] px-2 pb-4 pt-6 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosCurva}>
                <defs>
                  <linearGradient
                    id="gradiente-apostas"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={corCurva}
                      stopOpacity={0.45}
                    />
                    <stop
                      offset="85%"
                      stopColor={corCurva}
                      stopOpacity={0.03}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="#27272a"
                  strokeDasharray="4 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="data"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
                <ReferenceLine
                  y={0}
                  stroke="#52525b"
                  strokeDasharray="5 5"
                />
                <Tooltip content={<TooltipCurva />} />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke={corCurva}
                  strokeWidth={3}
                  fill="url(#gradiente-apostas)"
                  dot={false}
                  activeDot={{ r: 6 }}
                  animationDuration={900}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black">
          <div className="border-b border-zinc-800 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Distribuição
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">
              Resultados das apostas
            </h3>
          </div>

          <div className="relative h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie
                  data={dadosResultados}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={74}
                  outerRadius={104}
                  paddingAngle={4}
                  cornerRadius={7}
                  stroke="transparent"
                >
                  {dadosResultados.map((item) => (
                    <Cell key={item.nome} fill={item.cor} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-3xl text-white">{resumo.total}</strong>
              <span className="text-xs uppercase tracking-wider text-zinc-600">
                Apostas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-zinc-800 bg-zinc-800">
            {dadosResultados.map((item) => (
              <div
                key={item.nome}
                className="flex items-center justify-between bg-zinc-950 p-4"
              >
                <span className="flex items-center gap-2 text-xs text-zinc-500">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.cor }}
                  />
                  {item.nome}
                </span>
                <strong>{item.valor}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Comparativo
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">
              Desempenho por casa
            </h3>
          </div>

          <div className="h-[360px] px-2 pb-4 pt-6 sm:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosCasas}>
                <CartesianGrid
                  stroke="#27272a"
                  strokeDasharray="4 6"
                  vertical={false}
                />
                <XAxis
                  dataKey="nomeCurto"
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={65}
                  tick={{ fill: "#71717a", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={65}
                />
                <ReferenceLine y={0} stroke="#52525b" />
                <Tooltip content={<TooltipBarra />} />
                <Bar
                  dataKey="lucro"
                  maxBarSize={52}
                  radius={[6, 6, 0, 0]}
                >
                  {dadosCasas.map((item) => (
                    <Cell
                      key={item.nome}
                      fill={item.lucro >= 0 ? "#10b981" : "#f43f5e"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
              Origem
            </p>
            <h3 className="mt-2 text-lg font-bold text-white">
              Manuais x dicas
            </h3>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            {dadosOrigem.map((item) => (
              <div
                key={item.nome}
                className="rounded-2xl border border-zinc-800 bg-black p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <strong className="text-white">{item.nome}</strong>
                  <strong className={classeValor(item.lucro)}>
                    {moeda(item.lucro)}
                  </strong>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-600">Apostado</p>
                    <p className="mt-1 font-semibold text-white">
                      {moeda(item.apostado)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">ROI</p>
                    <p className="mt-1 font-semibold text-blue-400">
                      {percentual(item.roi)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">G / P</p>
                    <p className="mt-1 font-semibold text-white">
                      {item.ganhas} / {item.perdidas}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
