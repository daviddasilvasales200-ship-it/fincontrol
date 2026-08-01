"use client";

import { useMemo, useState } from "react";
import type { DicaAposta } from "@/types/dica-aposta";

type PainelPerformanceDicasProps = {
  dicas: DicaAposta[];
};

type ChaveAgrupamento =
  | "mercado"
  | "competicao"
  | "nivel_confianca";

type GrupoPerformance = {
  nome: string;
  total: number;
  finalizadas: number;
  ganhas: number;
  perdidas: number;
  anuladas: number;
  pendentes: number;
  taxaAcerto: number;
  lucro: number;
  roi: number;
};

type ItemRosca = {
  label: string;
  valor: number;
  cor: string;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarUnidades(valor: number) {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor.toFixed(2).replace(".", ",")} un`;
}

function formatarPercentual(valor: number) {
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

function obterNomeGrupo(
  dica: DicaAposta,
  chave: ChaveAgrupamento
) {
  if (chave === "mercado") {
    return dica.mercado || "Sem mercado";
  }

  if (chave === "competicao") {
    return dica.competicao || "Sem competição";
  }

  if (dica.nivel_confianca === "alta") {
    return "Alta";
  }

  if (dica.nivel_confianca === "media") {
    return "Média";
  }

  return "Baixa";
}

function agruparDicas(
  dicas: DicaAposta[],
  chave: ChaveAgrupamento
): GrupoPerformance[] {
  const mapa = new Map<string, GrupoPerformance>();

  for (const dica of dicas) {
    const nome = obterNomeGrupo(dica, chave);

    if (!mapa.has(nome)) {
      mapa.set(nome, {
        nome,
        total: 0,
        finalizadas: 0,
        ganhas: 0,
        perdidas: 0,
        anuladas: 0,
        pendentes: 0,
        taxaAcerto: 0,
        lucro: 0,
        roi: 0,
      });
    }

    const item = mapa.get(nome)!;

    item.total += 1;

    if (dica.resultado === "ganha") {
      item.ganhas += 1;
      item.finalizadas += 1;
    } else if (dica.resultado === "perdida") {
      item.perdidas += 1;
      item.finalizadas += 1;
    } else if (dica.resultado === "anulada") {
      item.anuladas += 1;
      item.finalizadas += 1;
    } else {
      item.pendentes += 1;
    }

    item.lucro += Number(dica.lucro_prejuizo || 0);
  }

  return Array.from(mapa.values())
    .map((item) => {
      const baseAcerto =
        item.ganhas + item.perdidas;

      const taxaAcerto =
        baseAcerto > 0
          ? (item.ganhas / baseAcerto) * 100
          : 0;

      const roi =
        item.finalizadas > 0
          ? item.lucro / item.finalizadas
          : 0;

      return {
        ...item,
        taxaAcerto,
        roi,
      };
    })
    .sort((a, b) => {
      if (b.lucro !== a.lucro) {
        return b.lucro - a.lucro;
      }

      if (b.taxaAcerto !== a.taxaAcerto) {
        return b.taxaAcerto - a.taxaAcerto;
      }

      return b.total - a.total;
    });
}

function obterClasseResultado(valor: number) {
  if (valor > 0) {
    return "text-emerald-400";
  }

  if (valor < 0) {
    return "text-rose-400";
  }

  return "text-zinc-300";
}

function gerarArcosRosca(
  itens: ItemRosca[],
  raio = 74,
  stroke = 18
) {
  const total = itens.reduce(
    (acc, item) => acc + item.valor,
    0
  );

  const circunferencia = 2 * Math.PI * raio;

  let acumulado = 0;

  return itens.map((item) => {
    const proporcao =
      total > 0 ? item.valor / total : 0;

    const comprimento =
      circunferencia * proporcao;

    const arco = {
      ...item,
      comprimento,
      offset:
        circunferencia * 0.25 - acumulado,
      circunferencia,
      stroke,
      raio,
    };

    acumulado += comprimento;

    return arco;
  });
}

function CardKpi({
  titulo,
  valor,
  descricao,
  destaque = "neutro",
}: {
  titulo: string;
  valor: string;
  descricao: string;
  destaque?: "neutro" | "positivo" | "negativo" | "alerta";
}) {
  const mapaClasses = {
    neutro:
      "border-zinc-800 bg-zinc-950 text-white",
    positivo:
      "border-emerald-900/60 bg-emerald-950/30 text-emerald-400",
    negativo:
      "border-rose-900/60 bg-rose-950/30 text-rose-400",
    alerta:
      "border-amber-900/60 bg-amber-950/30 text-amber-300",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${mapaClasses[destaque]}`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
        {titulo}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight">
        {valor}
      </p>

      <p className="mt-2 text-sm text-zinc-400">
        {descricao}
      </p>
    </div>
  );
}

function GraficoBarrasHorizontais({
  titulo,
  descricao,
  dados,
  modo = "lucro",
}: {
  titulo: string;
  descricao: string;
  dados: GrupoPerformance[];
  modo?: "lucro" | "taxa";
}) {
  const maximo =
    modo === "lucro"
      ? Math.max(
          1,
          ...dados.map((item) =>
            Math.abs(item.lucro)
          )
        )
      : Math.max(
          1,
          ...dados.map((item) => item.taxaAcerto)
        );

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="border-b border-zinc-800 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          Ranking visual
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          {titulo}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          {descricao}
        </p>
      </div>

      <div className="space-y-5 p-6">
        {dados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-5 py-10 text-center text-sm text-zinc-500">
            Nenhum dado suficiente para exibir.
          </div>
        ) : (
          dados.map((item, index) => {
            const valorBase =
              modo === "lucro"
                ? Math.abs(item.lucro)
                : item.taxaAcerto;

            const percentualBarra =
              (valorBase / maximo) * 100;

            const positivo =
              modo === "lucro"
                ? item.lucro >= 0
                : true;

            return (
              <div
                key={`${item.nome}-${index}`}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {item.nome}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {item.total} entrada(s) •{" "}
                      {item.ganhas} G /{" "}
                      {item.perdidas} P /{" "}
                      {item.anuladas} A
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        modo === "lucro"
                          ? obterClasseResultado(
                              item.lucro
                            )
                          : "text-cyan-300"
                      }`}
                    >
                      {modo === "lucro"
                        ? formatarUnidades(
                            item.lucro
                          )
                        : formatarPercentual(
                            item.taxaAcerto
                          )}
                    </p>

                    <p className="text-xs text-zinc-500">
                      ROI médio:{" "}
                      {formatarUnidades(item.roi)}
                    </p>
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-zinc-900">
                  <div
                    className={`h-full rounded-full transition-all ${
                      modo === "lucro"
                        ? positivo
                          ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                          : "bg-gradient-to-r from-rose-500 to-orange-400"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500"
                    }`}
                    style={{
                      width: `${Math.max(
                        6,
                        percentualBarra
                      )}%`,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function GraficoRoscaModerno({
  titulo,
  descricao,
  itens,
  totalCentro,
  legendaCentro,
}: {
  titulo: string;
  descricao: string;
  itens: ItemRosca[];
  totalCentro: string;
  legendaCentro: string;
}) {
  const arcos = gerarArcosRosca(itens);

  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="border-b border-zinc-800 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          Distribuição
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          {titulo}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          {descricao}
        </p>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
        <div className="flex items-center justify-center">
          <div className="relative h-[240px] w-[240px]">
            <svg
              viewBox="0 0 200 200"
              className="h-full w-full -rotate-90"
            >
              <circle
                cx="100"
                cy="100"
                r="74"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="18"
                fill="none"
              />

              {arcos.map((item) => (
                <circle
                  key={item.label}
                  cx="100"
                  cy="100"
                  r={item.raio}
                  stroke={item.cor}
                  strokeWidth={item.stroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${item.comprimento} ${item.circunferencia}`}
                  strokeDashoffset={item.offset}
                />
              ))}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-4xl font-bold text-white">
                {totalCentro}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
                {legendaCentro}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {itens.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-800 bg-black/30 p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: item.cor,
                  }}
                />

                <p className="text-sm font-medium text-white">
                  {item.label}
                </p>
              </div>

              <p className="mt-3 text-2xl font-bold text-white">
                {item.valor}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TabelaPerformance({
  titulo,
  descricao,
  dados,
}: {
  titulo: string;
  descricao: string;
  dados: GrupoPerformance[];
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="border-b border-zinc-800 px-6 py-5">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
          Painel analítico
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-white">
          {titulo}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          {descricao}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-zinc-900/60">
            <tr className="text-xs uppercase tracking-[0.18em] text-zinc-500">
              <th className="px-6 py-4 font-medium">
                Grupo
              </th>
              <th className="px-6 py-4 font-medium">
                Total
              </th>
              <th className="px-6 py-4 font-medium">
                Ganhas
              </th>
              <th className="px-6 py-4 font-medium">
                Perdidas
              </th>
              <th className="px-6 py-4 font-medium">
                Taxa
              </th>
              <th className="px-6 py-4 font-medium">
                Lucro
              </th>
              <th className="px-6 py-4 font-medium">
                ROI médio
              </th>
            </tr>
          </thead>

          <tbody>
            {dados.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-zinc-500"
                >
                  Sem grupos suficientes para análise.
                </td>
              </tr>
            ) : (
              dados.map((item, index) => (
                <tr
                  key={`${item.nome}-${index}`}
                  className="border-t border-zinc-800 text-sm"
                >
                  <td className="px-6 py-4 font-medium text-white">
                    {item.nome}
                  </td>

                  <td className="px-6 py-4 text-zinc-300">
                    {item.total}
                  </td>

                  <td className="px-6 py-4 text-emerald-400">
                    {item.ganhas}
                  </td>

                  <td className="px-6 py-4 text-rose-400">
                    {item.perdidas}
                  </td>

                  <td className="px-6 py-4 text-cyan-300">
                    {formatarPercentual(
                      item.taxaAcerto
                    )}
                  </td>

                  <td
                    className={`px-6 py-4 font-semibold ${obterClasseResultado(
                      item.lucro
                    )}`}
                  >
                    {formatarUnidades(item.lucro)}
                  </td>

                  <td className="px-6 py-4 text-zinc-300">
                    {formatarUnidades(item.roi)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function PainelPerformanceDicas({
  dicas,
}: PainelPerformanceDicasProps) {
  const [agrupamento, setAgrupamento] =
    useState<ChaveAgrupamento>("mercado");

  const [minimoEntradas, setMinimoEntradas] =
    useState(2);

  const dicasFinalizadas = useMemo(
    () =>
      dicas.filter(
        (dica) =>
          dica.resultado === "ganha" ||
          dica.resultado === "perdida" ||
          dica.resultado === "anulada"
      ),
    [dicas]
  );

  const grupos = useMemo(() => {
    return agruparDicas(
      dicasFinalizadas,
      agrupamento
    ).filter(
      (grupo) => grupo.total >= minimoEntradas
    );
  }, [
    dicasFinalizadas,
    agrupamento,
    minimoEntradas,
  ]);

  const melhores = useMemo(
    () => grupos.slice(0, 6),
    [grupos]
  );

  const melhoresPorTaxa = useMemo(
    () =>
      [...grupos]
        .sort((a, b) => {
          if (b.taxaAcerto !== a.taxaAcerto) {
            return b.taxaAcerto - a.taxaAcerto;
          }

          return b.total - a.total;
        })
        .slice(0, 6),
    [grupos]
  );

  const resumo = useMemo(() => {
    const totalFinalizadas =
      dicasFinalizadas.length;

    const ganhas = dicasFinalizadas.filter(
      (dica) => dica.resultado === "ganha"
    ).length;

    const perdidas = dicasFinalizadas.filter(
      (dica) =>
        dica.resultado === "perdida"
    ).length;

    const anuladas = dicasFinalizadas.filter(
      (dica) =>
        dica.resultado === "anulada"
    ).length;

    const lucro = dicasFinalizadas.reduce(
      (acc, dica) =>
        acc + Number(dica.lucro_prejuizo || 0),
      0
    );

    const taxa =
      ganhas + perdidas > 0
        ? (ganhas / (ganhas + perdidas)) * 100
        : 0;

    return {
      totalFinalizadas,
      ganhas,
      perdidas,
      anuladas,
      lucro,
      taxa,
    };
  }, [dicasFinalizadas]);

  const melhorGrupo =
    grupos.length > 0 ? grupos[0] : null;

  const itensRosca = useMemo<ItemRosca[]>(
    () => [
      {
        label: "Ganhas",
        valor: resumo.ganhas,
        cor: "#10b981",
      },
      {
        label: "Perdidas",
        valor: resumo.perdidas,
        cor: "#f43f5e",
      },
      {
        label: "Anuladas",
        valor: resumo.anuladas,
        cor: "#f59e0b",
      },
    ].filter((item) => item.valor > 0),
    [resumo]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">
              Inteligência de desempenho
            </p>

            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
              Painel por mercado e competição
            </h2>

            <p className="mt-2 max-w-3xl text-sm text-zinc-400">
              Compare mercados, competições e níveis de confiança usando
              somente dicas já resolvidas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500">
                Agrupar por
              </label>

              <select
                value={agrupamento}
                onChange={(event) =>
                  setAgrupamento(
                    event.target
                      .value as ChaveAgrupamento
                  )
                }
                className="h-11 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none transition focus:border-red-500"
              >
                <option value="mercado">
                  Mercado
                </option>
                <option value="competicao">
                  Competição
                </option>
                <option value="nivel_confianca">
                  Nível de confiança
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-zinc-500">
                Mínimo de entradas
              </label>

              <select
                value={minimoEntradas}
                onChange={(event) =>
                  setMinimoEntradas(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="h-11 rounded-xl border border-zinc-800 bg-zinc-950 px-4 text-sm text-white outline-none transition focus:border-red-500"
              >
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={5}>5+</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardKpi
          titulo="Grupos analisados"
          valor={String(grupos.length)}
          descricao="Mercados, competições ou níveis de confiança após os filtros."
        />

        <CardKpi
          titulo="Taxa geral"
          valor={formatarPercentual(
            resumo.taxa
          )}
          descricao="Taxa de acerto considerando apenas ganhas e perdidas."
          destaque="alerta"
        />

        <CardKpi
          titulo="Lucro acumulado"
          valor={formatarUnidades(
            resumo.lucro
          )}
          descricao="Resultado somado das dicas finalizadas."
          destaque={
            resumo.lucro > 0
              ? "positivo"
              : resumo.lucro < 0
              ? "negativo"
              : "neutro"
          }
        />

        <CardKpi
          titulo="Melhor grupo"
          valor={
            melhorGrupo
              ? melhorGrupo.nome
              : "—"
          }
          descricao={
            melhorGrupo
              ? `${formatarUnidades(
                  melhorGrupo.lucro
                )} • ${formatarPercentual(
                  melhorGrupo.taxaAcerto
                )}`
              : "Sem dados suficientes."
          }
          destaque="positivo"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <GraficoBarrasHorizontais
          titulo="Melhores desempenhos por lucro"
          descricao="Ranking visual com foco no resultado acumulado."
          dados={melhores}
          modo="lucro"
        />

        <GraficoRoscaModerno
          titulo="Distribuição dos resultados"
          descricao="Leitura rápida do volume de dicas já resolvidas."
          itens={itensRosca}
          totalCentro={String(
            resumo.totalFinalizadas
          )}
          legendaCentro="FINALIZADAS"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.05fr]">
        <GraficoBarrasHorizontais
          titulo="Maiores taxas de acerto"
          descricao="Comparação baseada no percentual de acerto."
          dados={melhoresPorTaxa}
          modo="taxa"
        />

        <TabelaPerformance
          titulo="Ranking analítico"
          descricao="Tabela completa para leitura detalhada."
          dados={grupos}
        />
      </div>
    </section>
  );
}