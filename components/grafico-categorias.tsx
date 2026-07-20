"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type CategoriaGrafico = {
  categoria: string;
  valor: number;
  percentual: number;
};

type GraficoCategoriasProps = {
  dados: CategoriaGrafico[];
};

const cores = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#71717a",
];

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function GraficoCategorias({
  dados,
}: GraficoCategoriasProps) {
  if (dados.length === 0) {
    return (
      <div className="mt-8 flex min-h-64 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-black">
        <div className="text-center">
          <p className="text-4xl">◔</p>

          <p className="mt-3 font-medium text-zinc-300">
            Nenhuma despesa neste mês
          </p>

          <p className="mt-1 text-sm text-zinc-600">
            Cadastre despesas para visualizar as categorias.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dados}
              dataKey="valor"
              nameKey="categoria"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={3}
              stroke="none"
            >
              {dados.map((item, indice) => (
                <Cell
                  key={`${item.categoria}-${indice}`}
                  fill={cores[indice % cores.length]}
                />
              ))}
            </Pie>

            <Tooltip
              contentStyle={{
                backgroundColor: "#09090b",
                border: "1px solid #27272a",
                borderRadius: "12px",
              }}
              labelStyle={{
                color: "#ffffff",
              }}
              formatter={(valor) => [
                formatarMoeda(Number(valor)),
                "Total",
              ]}
            />

            <Legend
              verticalAlign="bottom"
              formatter={(valor) => (
                <span className="text-sm text-zinc-300">
                  {valor}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-4">
        {dados.map((item, indice) => (
          <div key={item.categoria}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: cores[indice % cores.length],
                  }}
                />

                <span className="truncate text-zinc-300">
                  {item.categoria}
                </span>
              </div>

              <div className="shrink-0 text-right">
                <span className="font-semibold text-white">
                  {formatarMoeda(item.valor)}
                </span>

                <span className="ml-2 text-zinc-500">
                  {item.percentual.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(item.percentual, 100)}%`,
                  backgroundColor: cores[indice % cores.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}