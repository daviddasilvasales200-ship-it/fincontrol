"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DadosMes = {
  mes: string;
  receitas: number;
  despesas: number;
};

type GraficoFinanceiroProps = {
  dados: DadosMes[];
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function GraficoFinanceiro({
  dados,
}: GraficoFinanceiroProps) {
  const possuiMovimentacoes = dados.some(
    (item) => item.receitas > 0 || item.despesas > 0
  );

  if (!possuiMovimentacoes) {
    return (
      <div className="mt-8 flex h-72 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-black">
        <div className="text-center">
          <p className="text-4xl">📊</p>

          <p className="mt-3 font-medium text-zinc-300">
            Nenhuma movimentação no período
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Adicione receitas e despesas para gerar o gráfico.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={dados}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />

          <XAxis
            dataKey="mes"
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />

          <YAxis
            stroke="#71717a"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(valor) =>
              Number(valor).toLocaleString("pt-BR", {
                notation: "compact",
                compactDisplay: "short",
              })
            }
          />

          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            contentStyle={{
              backgroundColor: "#09090b",
              border: "1px solid #27272a",
              borderRadius: "12px",
            }}
            labelStyle={{
              color: "#ffffff",
              fontWeight: 600,
            }}
            formatter={(valor, nome) => [
              formatarMoeda(Number(valor)),
              nome === "receitas" ? "Receitas" : "Despesas",
            ]}
          />

          <Legend
            formatter={(valor) =>
              valor === "receitas" ? "Receitas" : "Despesas"
            }
          />

          <Bar
            dataKey="receitas"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="despesas"
            fill="#ef4444"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}