"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type {
  DicaAposta,
} from "@/types/dica-aposta";

type GraficosDicasProps = {
  dicas: DicaAposta[];
  carregando?: boolean;
};

type PeriodoGrafico =
  | "todos"
  | "30"
  | "90";

type ModoDesempenho =
  | "diario"
  | "entrada";

type ResultadoGrafico =
  | "ganha"
  | "perdida"
  | "anulada"
  | "pendente";

type ItemTooltip = {
  name?: string;
  value?: number | string;

  payload?: {
    nome?: string;
    dataCompleta?: string;
    confronto?: string;
    lucro?: number;
    lucroDiario?: number;
    acumulado?: number;
    mediaMovel?: number | null;
    quantidade?: number;
    ganhas?: number;
    perdidas?: number;
    anuladas?: number;
    pendentes?: number;
    taxaAcerto?: number;
  };
};

type TooltipGraficoProps = {
  active?: boolean;
  label?: string | number;
  payload?: ItemTooltip[];
};

type EntradaFinalizada = {
  dica: DicaAposta;
  data: Date;
  lucro: number;
};

const CORES_RESULTADO: Record<
  ResultadoGrafico,
  string
> = {
  ganha: "#10b981",
  perdida: "#f43f5e",
  anulada: "#71717a",
  pendente: "#f59e0b",
};

const TEXTOS_RESULTADO: Record<
  ResultadoGrafico,
  string
> = {
  ganha: "Ganhas",
  perdida: "Perdidas",
  anulada: "Anuladas",
  pendente: "Pendentes",
};

function normalizarNumero(
  valor:
    | number
    | string
    | null
    | undefined
) {
  const numero = Number(
    valor ?? 0
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function arredondar(
  valor: number,
  casas = 2
) {
  return Number(
    valor.toFixed(casas)
  );
}

function converterData(
  valor:
    | string
    | null
    | undefined
) {
  if (!valor) {
    return null;
  }

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data;
}

function obterDataDica(
  dica: DicaAposta
) {
  return (
    converterData(
      dica.resultado_verificado_em
    ) ??
    converterData(
      dica.atualizada_em
    ) ??
    converterData(
      dica.publicada_em
    ) ??
    converterData(
      dica.created_at
    ) ??
    converterData(
      dica.data_jogo
    )
  );
}

function obterChaveDia(
  data: Date
) {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).format(data);
}

function formatarDataCurta(
  data: Date
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "2-digit",
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(data);
}

function formatarDataCompleta(
  data: Date
) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      dateStyle: "short",
      timeZone:
        "America/Sao_Paulo",
    }
  ).format(data);
}

function formatarNumero(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    normalizarNumero(valor)
  );
}

function formatarPercentual(
  valor: number
) {
  return `${new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }
  ).format(
    normalizarNumero(valor)
  )}%`;
}

function formatarUnidades(
  valor: number
) {
  const numero =
    normalizarNumero(valor);

  const prefixo =
    numero > 0
      ? "+"
      : "";

  return `${prefixo}${formatarNumero(
    numero
  )} un`;
}

function limitarTexto(
  texto: string,
  limite: number
) {
  const valor =
    texto.trim();

  if (
    valor.length <= limite
  ) {
    return valor;
  }

  return `${valor.slice(
    0,
    limite - 1
  )}…`;
}

function obterClasseResultado(
  valor: number
) {
  if (valor > 0) {
    return "text-emerald-400";
  }

  if (valor < 0) {
    return "text-rose-400";
  }

  return "text-zinc-300";
}

function obterEntradasFinalizadas(
  dicas: DicaAposta[]
): EntradaFinalizada[] {
  return dicas
    .filter(
      (dica) =>
        dica.resultado !==
        "pendente"
    )
    .map((dica) => ({
      dica,
      data:
        obterDataDica(dica),
      lucro:
        normalizarNumero(
          dica.lucro_prejuizo
        ),
    }))
    .filter(
      (
        item
      ): item is EntradaFinalizada =>
        item.data !== null
    )
    .sort(
      (a, b) =>
        a.data.getTime() -
        b.data.getTime()
    );
}

function calcularSequencias(
  entradas: EntradaFinalizada[]
) {
  let sequenciaGanhosAtual = 0;
  let sequenciaPerdasAtual = 0;
  let maiorSequenciaGanhos = 0;
  let maiorSequenciaPerdas = 0;

  entradas.forEach(
    ({ dica }) => {
      if (
        dica.resultado ===
        "ganha"
      ) {
        sequenciaGanhosAtual += 1;
        sequenciaPerdasAtual = 0;

        maiorSequenciaGanhos =
          Math.max(
            maiorSequenciaGanhos,
            sequenciaGanhosAtual
          );
      } else if (
        dica.resultado ===
        "perdida"
      ) {
        sequenciaPerdasAtual += 1;
        sequenciaGanhosAtual = 0;

        maiorSequenciaPerdas =
          Math.max(
            maiorSequenciaPerdas,
            sequenciaPerdasAtual
          );
      } else {
        sequenciaGanhosAtual = 0;
        sequenciaPerdasAtual = 0;
      }
    }
  );

  return {
    maiorSequenciaGanhos,
    maiorSequenciaPerdas,
  };
}

function calcularMediaMovel(
  valores: number[],
  indice: number,
  janela = 5
) {
  const inicio = Math.max(
    0,
    indice - janela + 1
  );

  const fatia =
    valores.slice(
      inicio,
      indice + 1
    );

  if (
    fatia.length < janela
  ) {
    return null;
  }

  const total =
    fatia.reduce(
      (
        acumulado,
        valor
      ) =>
        acumulado + valor,
      0
    );

  return arredondar(
    total / fatia.length
  );
}

function TooltipDesempenho({
  active,
  payload,
}: TooltipGraficoProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const dados =
    payload[0]?.payload;

  if (!dados) {
    return null;
  }

  const lucro =
    normalizarNumero(
      dados.lucroDiario ??
      dados.lucro
    );

  return (
    <div className="min-w-56 rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {dados.dataCompleta ??
          "Resultado"}
      </p>

      {dados.confronto && (
        <p className="mt-2 max-w-64 text-sm font-semibold text-white">
          {dados.confronto}
        </p>
      )}

      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-zinc-400">
            Resultado
          </span>

          <strong
            className={obterClasseResultado(
              lucro
            )}
          >
            {formatarUnidades(
              lucro
            )}
          </strong>
        </div>

        {dados.quantidade !==
          undefined && (
          <div className="flex items-center justify-between gap-6 text-sm">
            <span className="text-zinc-400">
              Entradas no dia
            </span>

            <strong className="text-white">
              {dados.quantidade}
            </strong>
          </div>
        )}

        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="text-zinc-400">
            Acumulado
          </span>

          <strong
            className={obterClasseResultado(
              normalizarNumero(
                dados.acumulado
              )
            )}
          >
            {formatarUnidades(
              normalizarNumero(
                dados.acumulado
              )
            )}
          </strong>
        </div>

        {dados.mediaMovel !==
          null &&
          dados.mediaMovel !==
            undefined && (
            <div className="flex items-center justify-between gap-6 border-t border-zinc-800 pt-2 text-sm">
              <span className="text-zinc-400">
                Média móvel
              </span>

              <strong className="text-blue-400">
                {formatarUnidades(
                  dados.mediaMovel
                )}
              </strong>
            </div>
          )}
      </div>
    </div>
  );
}

function TooltipResultados({
  active,
  payload,
}: TooltipGraficoProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const item =
    payload[0];

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-950/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur">
      <p className="text-sm font-semibold text-white">
        {item.name ??
          "Resultado"}
      </p>

      <p className="mt-1 text-sm text-zinc-400">
        {normalizarNumero(
          item.value
        )} entrada(s)
      </p>
    </div>
  );
}

function TooltipMercados({
  active,
  payload,
  label,
}: TooltipGraficoProps) {
  if (
    !active ||
    !payload ||
    payload.length === 0
  ) {
    return null;
  }

  const dados =
    payload[0]?.payload;

  if (!dados) {
    return null;
  }

  return (
    <div className="min-w-52 rounded-xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl shadow-black/60 backdrop-blur">
      <p className="font-semibold text-white">
        {dados.nome ??
          String(label ?? "")}
      </p>

      <div className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">
            Ganhas
          </span>

          <strong className="text-emerald-400">
            {normalizarNumero(
              dados.ganhas
            )}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">
            Perdidas
          </span>

          <strong className="text-rose-400">
            {normalizarNumero(
              dados.perdidas
            )}
          </strong>
        </div>

        <div className="flex items-center justify-between gap-6">
          <span className="text-zinc-400">
            Anuladas
          </span>

          <strong className="text-zinc-300">
            {normalizarNumero(
              dados.anuladas
            )}
          </strong>
        </div>

        <div className="border-t border-zinc-800 pt-2">
          <div className="flex items-center justify-between gap-6">
            <span className="text-zinc-400">
              Taxa de acerto
            </span>

            <strong className="text-blue-400">
              {formatarPercentual(
                normalizarNumero(
                  dados.taxaAcerto
                )
              )}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function EstadoCarregando() {
  return (
    <section className="space-y-6">
      <div className="h-28 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950" />

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <div className="h-[440px] animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />

        <div className="h-[440px] animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />
      </div>

      <div className="h-[430px] animate-pulse rounded-3xl border border-zinc-800 bg-zinc-950" />
    </section>
  );
}

function EstadoSemDados() {
  return (
    <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/70 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-black text-2xl">
        ◔
      </div>

      <h3 className="mt-5 text-lg font-bold text-white">
        Ainda não há dados suficientes
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
        Os gráficos serão preenchidos quando
        existirem dicas registradas e resultados
        finalizados.
      </p>
    </div>
  );
}

function CardIndicador({
  titulo,
  valor,
  descricao,
  destaque = "neutro",
}: {
  titulo: string;
  valor: string;
  descricao: string;
  destaque?:
    | "neutro"
    | "positivo"
    | "negativo"
    | "informativo";
}) {
  const classes = {
    neutro:
      "border-zinc-800 bg-black text-white",

    positivo:
      "border-emerald-900/50 bg-emerald-950/20 text-emerald-400",

    negativo:
      "border-rose-900/50 bg-rose-950/20 text-rose-400",

    informativo:
      "border-blue-900/50 bg-blue-950/20 text-blue-400",
  };

  return (
    <div
      className={`rounded-2xl border p-4 ${classes[destaque]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
        {titulo}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {valor}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {descricao}
      </p>
    </div>
  );
}

export default function GraficosDicas({
  dicas,
  carregando = false,
}: GraficosDicasProps) {
  const [
    periodo,
    setPeriodo,
  ] =
    useState<PeriodoGrafico>(
      "todos"
    );

  const [
    modoDesempenho,
    setModoDesempenho,
  ] =
    useState<ModoDesempenho>(
      "diario"
    );

  const dicasPeriodo =
    useMemo(() => {
      if (
        periodo === "todos"
      ) {
        return dicas;
      }

      const quantidadeDias =
        Number(periodo);

      const limite =
        new Date();

      limite.setDate(
        limite.getDate() -
          quantidadeDias
      );

      limite.setHours(
        0,
        0,
        0,
        0
      );

      return dicas.filter(
        (dica) => {
          const data =
            obterDataDica(dica);

          if (!data) {
            return false;
          }

          return (
            data.getTime() >=
            limite.getTime()
          );
        }
      );
    }, [
      dicas,
      periodo,
    ]);

  const entradasFinalizadas =
    useMemo(
      () =>
        obterEntradasFinalizadas(
          dicasPeriodo
        ),
      [dicasPeriodo]
    );

  const dadosResultados =
    useMemo(() => {
      const contagem: Record<
        ResultadoGrafico,
        number
      > = {
        ganha: 0,
        perdida: 0,
        anulada: 0,
        pendente: 0,
      };

      dicasPeriodo.forEach(
        (dica) => {
          const resultado =
            dica.resultado as
              ResultadoGrafico;

          if (
            resultado in contagem
          ) {
            contagem[resultado] +=
              1;
          }
        }
      );

      return (
        Object.keys(
          contagem
        ) as ResultadoGrafico[]
      )
        .map(
          (resultado) => ({
            chave: resultado,

            nome:
              TEXTOS_RESULTADO[
                resultado
              ],

            valor:
              contagem[
                resultado
              ],

            cor:
              CORES_RESULTADO[
                resultado
              ],
          })
        )
        .filter(
          (item) =>
            item.valor > 0
        );
    }, [dicasPeriodo]);

  const dadosPorEntrada =
    useMemo(() => {
      const lucros =
        entradasFinalizadas.map(
          (item) =>
            item.lucro
        );

      let acumulado = 0;

      return entradasFinalizadas.map(
        (
          item,
          indice
        ) => {
          acumulado +=
            item.lucro;

          return {
            indice:
              indice + 1,

            data:
              formatarDataCurta(
                item.data
              ),

            dataCompleta:
              formatarDataCompleta(
                item.data
              ),

            confronto:
              `${item.dica.time_casa} x ${item.dica.time_visitante}`,

            lucro:
              arredondar(
                item.lucro
              ),

            acumulado:
              arredondar(
                acumulado
              ),

            mediaMovel:
              calcularMediaMovel(
                lucros,
                indice
              ),
          };
        }
      );
    }, [
      entradasFinalizadas,
    ]);

  const dadosDiarios =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          {
            data: Date;
            lucroDiario: number;
            quantidade: number;
          }
        >();

      entradasFinalizadas.forEach(
        (item) => {
          const chave =
            obterChaveDia(
              item.data
            );

          const registro =
            mapa.get(
              chave
            ) ?? {
              data:
                item.data,

              lucroDiario: 0,

              quantidade: 0,
            };

          registro.lucroDiario +=
            item.lucro;

          registro.quantidade +=
            1;

          mapa.set(
            chave,
            registro
          );
        }
      );

      const dias =
        Array.from(
          mapa.values()
        ).sort(
          (a, b) =>
            a.data.getTime() -
            b.data.getTime()
        );

      const lucros =
        dias.map(
          (dia) =>
            dia.lucroDiario
        );

      let acumulado = 0;

      return dias.map(
        (
          dia,
          indice
        ) => {
          acumulado +=
            dia.lucroDiario;

          return {
            data:
              formatarDataCurta(
                dia.data
              ),

            dataCompleta:
              formatarDataCompleta(
                dia.data
              ),

            lucroDiario:
              arredondar(
                dia.lucroDiario
              ),

            acumulado:
              arredondar(
                acumulado
              ),

            quantidade:
              dia.quantidade,

            mediaMovel:
              calcularMediaMovel(
                lucros,
                indice
              ),
          };
        }
      );
    }, [
      entradasFinalizadas,
    ]);

  const dadosDesempenho =
    modoDesempenho ===
    "diario"
      ? dadosDiarios
      : dadosPorEntrada;

  const dadosMercados =
    useMemo(() => {
      const mapa =
        new Map<
          string,
          {
            nome: string;
            ganhas: number;
            perdidas: number;
            anuladas: number;
            pendentes: number;
          }
        >();

      dicasPeriodo.forEach(
        (dica) => {
          const nomeMercado =
            dica.mercado
              ?.trim() ||
            "Outros";

          const registro =
            mapa.get(
              nomeMercado
            ) ?? {
              nome:
                nomeMercado,

              ganhas: 0,
              perdidas: 0,
              anuladas: 0,
              pendentes: 0,
            };

          if (
            dica.resultado ===
            "ganha"
          ) {
            registro.ganhas += 1;
          } else if (
            dica.resultado ===
            "perdida"
          ) {
            registro.perdidas +=
              1;
          } else if (
            dica.resultado ===
            "anulada"
          ) {
            registro.anuladas +=
              1;
          } else {
            registro.pendentes +=
              1;
          }

          mapa.set(
            nomeMercado,
            registro
          );
        }
      );

      return Array.from(
        mapa.values()
      )
        .map((item) => {
          const decisoes =
            item.ganhas +
            item.perdidas;

          const taxaAcerto =
            decisoes > 0
              ? (
                  item.ganhas /
                  decisoes
                ) *
                100
              : 0;

          return {
            ...item,

            mercadoCurto:
              limitarTexto(
                item.nome,
                23
              ),

            total:
              item.ganhas +
              item.perdidas +
              item.anuladas +
              item.pendentes,

            taxaAcerto:
              arredondar(
                taxaAcerto,
                1
              ),
          };
        })
        .sort(
          (a, b) =>
            b.total -
            a.total
        )
        .slice(0, 7);
    }, [dicasPeriodo]);

  const resumo =
    useMemo(() => {
      const ganhas =
        dicasPeriodo.filter(
          (dica) =>
            dica.resultado ===
            "ganha"
        ).length;

      const perdidas =
        dicasPeriodo.filter(
          (dica) =>
            dica.resultado ===
            "perdida"
        ).length;

      const finalizadas =
        ganhas +
        perdidas;

      const taxaAcerto =
        finalizadas > 0
          ? (
              ganhas /
              finalizadas
            ) *
            100
          : 0;

      const lucroAcumulado =
        entradasFinalizadas.reduce(
          (
            total,
            item
          ) =>
            total +
            item.lucro,
          0
        );

      const sequencias =
        calcularSequencias(
          entradasFinalizadas
        );

      const melhorDia =
        dadosDiarios.length >
        0
          ? dadosDiarios.reduce(
              (
                melhor,
                atual
              ) =>
                atual.lucroDiario >
                melhor.lucroDiario
                  ? atual
                  : melhor
            )
          : null;

      const piorDia =
        dadosDiarios.length >
        0
          ? dadosDiarios.reduce(
              (
                pior,
                atual
              ) =>
                atual.lucroDiario <
                pior.lucroDiario
                  ? atual
                  : pior
            )
          : null;

      return {
        total:
          dicasPeriodo.length,

        finalizadas,

        taxaAcerto:
          arredondar(
            taxaAcerto,
            1
          ),

        lucroAcumulado:
          arredondar(
            lucroAcumulado
          ),

        ...sequencias,

        melhorDia,
        piorDia,
      };
    }, [
      dadosDiarios,
      dicasPeriodo,
      entradasFinalizadas,
    ]);

  if (carregando) {
    return (
      <EstadoCarregando />
    );
  }

  if (dicas.length === 0) {
    return (
      <EstadoSemDados />
    );
  }

  const ultimoAcumulado =
    dadosDesempenho.at(
      -1
    )?.acumulado ?? 0;

  const corDesempenho =
    ultimoAcumulado >= 0
      ? "#10b981"
      : "#f43f5e";

  const melhorMercado =
    [...dadosMercados]
      .filter(
        (item) =>
          item.ganhas +
            item.perdidas >
          0
      )
      .sort(
        (a, b) =>
          b.taxaAcerto -
          a.taxaAcerto
      )[0] ?? null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
            Análise visual
          </p>

          <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
            Desempenho das entradas
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Evolução, distribuição, sequências
            e desempenho por mercado.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-black p-1">
            {(
              [
                {
                  valor:
                    "diario",

                  texto:
                    "Visão diária",
                },
                {
                  valor:
                    "entrada",

                  texto:
                    "Por entrada",
                },
              ] as const
            ).map(
              (opcao) => (
                <button
                  key={
                    opcao.valor
                  }
                  type="button"
                  onClick={() =>
                    setModoDesempenho(
                      opcao.valor
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                    modoDesempenho ===
                    opcao.valor
                      ? "bg-zinc-800 text-white"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  {opcao.texto}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 bg-black p-1">
            {(
              [
                {
                  valor: "30",
                  texto: "30 dias",
                },
                {
                  valor: "90",
                  texto: "90 dias",
                },
                {
                  valor:
                    "todos",
                  texto: "Tudo",
                },
              ] as const
            ).map(
              (opcao) => (
                <button
                  key={
                    opcao.valor
                  }
                  type="button"
                  onClick={() =>
                    setPeriodo(
                      opcao.valor
                    )
                  }
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 ${
                    periodo ===
                    opcao.valor
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                      : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                  }`}
                >
                  {opcao.texto}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CardIndicador
          titulo="Maior sequência positiva"
          valor={`${resumo.maiorSequenciaGanhos}`}
          descricao="Entradas ganhas consecutivamente"
          destaque="positivo"
        />

        <CardIndicador
          titulo="Maior sequência negativa"
          valor={`${resumo.maiorSequenciaPerdas}`}
          descricao="Entradas perdidas consecutivamente"
          destaque="negativo"
        />

        <CardIndicador
          titulo="Melhor dia"
          valor={
            resumo.melhorDia
              ? formatarUnidades(
                  resumo.melhorDia
                    .lucroDiario
                )
              : "Sem dados"
          }
          descricao={
            resumo.melhorDia
              ? resumo.melhorDia
                  .dataCompleta
              : "Nenhum resultado finalizado"
          }
          destaque="positivo"
        />

        <CardIndicador
          titulo="Pior dia"
          valor={
            resumo.piorDia
              ? formatarUnidades(
                  resumo.piorDia
                    .lucroDiario
                )
              : "Sem dados"
          }
          descricao={
            resumo.piorDia
              ? resumo.piorDia
                  .dataCompleta
              : "Nenhum resultado finalizado"
          }
          destaque="negativo"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-4 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Curva de desempenho
              </p>

              <h3 className="mt-2 text-lg font-bold text-white">
                Lucro acumulado
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                {modoDesempenho ===
                "diario"
                  ? "Resultados agrupados por dia."
                  : "Evolução individual de cada entrada."}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Saldo acumulado
              </p>

              <p
                className={`mt-1 text-xl font-bold ${obterClasseResultado(
                  ultimoAcumulado
                )}`}
              >
                {formatarUnidades(
                  ultimoAcumulado
                )}
              </p>
            </div>
          </div>

          {dadosDesempenho.length ===
          0 ? (
            <div className="flex h-[350px] items-center justify-center px-6 text-center text-sm text-zinc-500">
              Ainda não existem resultados
              finalizados neste período.
            </div>
          ) : (
            <div className="h-[370px] w-full px-2 pb-4 pt-6 sm:px-4">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={
                    dadosDesempenho
                  }
                  margin={{
                    top: 10,
                    right: 18,
                    left: 0,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="gradienteDesempenho"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={
                          corDesempenho
                        }
                        stopOpacity={
                          0.45
                        }
                      />

                      <stop
                        offset="80%"
                        stopColor={
                          corDesempenho
                        }
                        stopOpacity={
                          0.03
                        }
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
                    stroke="#52525b"
                    tick={{
                      fill: "#71717a",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />

                  <YAxis
                    stroke="#52525b"
                    tick={{
                      fill: "#71717a",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={46}
                    tickFormatter={(
                      valor
                    ) =>
                      Number(
                        valor
                      ).toFixed(1)
                    }
                  />

                  <ReferenceLine
                    y={0}
                    stroke="#52525b"
                    strokeDasharray="5 5"
                  />

                  <Tooltip
                    content={
                      <TooltipDesempenho />
                    }
                    cursor={{
                      stroke:
                        "#3f3f46",
                      strokeDasharray:
                        "4 4",
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    name="Acumulado"
                    stroke={
                      corDesempenho
                    }
                    strokeWidth={3}
                    fill="url(#gradienteDesempenho)"
                    activeDot={{
                      r: 6,
                      fill:
                        corDesempenho,
                      stroke:
                        "#09090b",
                      strokeWidth: 3,
                    }}
                    dot={false}
                    animationDuration={
                      900
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="mediaMovel"
                    name="Média móvel"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="6 5"
                    dot={false}
                    connectNulls={false}
                    animationDuration={
                      900
                    }
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-5 border-t border-zinc-800 px-5 py-4 text-xs text-zinc-500 sm:px-6">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    corDesempenho,
                }}
              />

              Lucro acumulado
            </span>

            <span className="flex items-center gap-2">
              <span className="h-0.5 w-5 bg-blue-500" />

              Média móvel de 5 resultados
            </span>
          </div>
        </article>

        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black shadow-2xl shadow-black/20">
          <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
              Distribuição
            </p>

            <h3 className="mt-2 text-lg font-bold text-white">
              Resultados das entradas
            </h3>

            <p className="mt-1 text-sm text-zinc-500">
              Visão geral do período selecionado.
            </p>
          </div>

          <div className="relative h-[265px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <PieChart>
                <Tooltip
                  content={
                    <TooltipResultados />
                  }
                />

                <Pie
                  data={
                    dadosResultados
                  }
                  dataKey="valor"
                  nameKey="nome"
                  cx="50%"
                  cy="50%"
                  innerRadius={73}
                  outerRadius={102}
                  paddingAngle={4}
                  cornerRadius={7}
                  stroke="transparent"
                  animationDuration={
                    900
                  }
                >
                  {dadosResultados.map(
                    (item) => (
                      <Cell
                        key={
                          item.chave
                        }
                        fill={
                          item.cor
                        }
                      />
                    )
                  )}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-white">
                {resumo.total}
              </span>

              <span className="mt-1 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                Entradas
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-zinc-800 bg-zinc-800">
            {dadosResultados.map(
              (item) => (
                <div
                  key={
                    item.chave
                  }
                  className="flex items-center justify-between gap-3 bg-zinc-950 px-4 py-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor:
                          item.cor,
                      }}
                    />

                    <span className="text-xs font-medium text-zinc-500">
                      {item.nome}
                    </span>
                  </div>

                  <strong className="text-sm text-white">
                    {item.valor}
                  </strong>
                </div>
              )
            )}
          </div>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
        <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black shadow-2xl shadow-black/20">
          <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
                Comparativo
              </p>

              <h3 className="mt-2 text-lg font-bold text-white">
                Desempenho por mercado
              </h3>

              <p className="mt-1 text-sm text-zinc-500">
                Mercados com maior número de
                entradas no período.
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-900/60 bg-blue-950/30 px-3 py-1.5 text-xs font-semibold text-blue-400">
              Top{" "}
              {dadosMercados.length}
            </span>
          </div>

          {dadosMercados.length ===
          0 ? (
            <div className="flex h-[340px] items-center justify-center px-6 text-center text-sm text-zinc-500">
              Nenhum mercado disponível neste
              período.
            </div>
          ) : (
            <div className="h-[370px] w-full px-2 pb-4 pt-6 sm:px-4">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    dadosMercados
                  }
                  margin={{
                    top: 5,
                    right: 12,
                    left: 0,
                    bottom: 28,
                  }}
                >
                  <CartesianGrid
                    stroke="#27272a"
                    strokeDasharray="4 6"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="mercadoCurto"
                    stroke="#52525b"
                    tick={{
                      fill: "#71717a",
                      fontSize: 10,
                    }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-18}
                    textAnchor="end"
                    height={65}
                  />

                  <YAxis
                    allowDecimals={
                      false
                    }
                    stroke="#52525b"
                    tick={{
                      fill: "#71717a",
                      fontSize: 11,
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={32}
                  />

                  <Tooltip
                    content={
                      <TooltipMercados />
                    }
                    cursor={{
                      fill:
                        "rgba(63, 63, 70, 0.22)",
                    }}
                  />

                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{
                      fontSize:
                        "12px",
                      color:
                        "#a1a1aa",
                    }}
                  />

                  <Bar
                    dataKey="ganhas"
                    name="Ganhas"
                    stackId="resultado"
                    fill="#10b981"
                    radius={[
                      0,
                      0,
                      4,
                      4,
                    ]}
                    maxBarSize={48}
                    animationDuration={
                      900
                    }
                  />

                  <Bar
                    dataKey="perdidas"
                    name="Perdidas"
                    stackId="resultado"
                    fill="#f43f5e"
                    maxBarSize={48}
                    animationDuration={
                      900
                    }
                  />

                  <Bar
                    dataKey="anuladas"
                    name="Anuladas"
                    stackId="resultado"
                    fill="#71717a"
                    maxBarSize={48}
                    animationDuration={
                      900
                    }
                  />

                  <Bar
                    dataKey="pendentes"
                    name="Pendentes"
                    stackId="resultado"
                    fill="#f59e0b"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                    maxBarSize={48}
                    animationDuration={
                      900
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black p-5 shadow-2xl shadow-black/20 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-600">
            Resumo do período
          </p>

          <h3 className="mt-2 text-lg font-bold text-white">
            Indicadores
          </h3>

          <div className="mt-6 space-y-4">
            <CardIndicador
              titulo="Total analisado"
              valor={`${resumo.total}`}
              descricao="Entradas registradas"
            />

            <CardIndicador
              titulo="Resultados concluídos"
              valor={`${resumo.finalizadas}`}
              descricao="Ganhas e perdidas no período"
              destaque="positivo"
            />

            <CardIndicador
              titulo="Taxa de acerto"
              valor={formatarPercentual(
                resumo.taxaAcerto
              )}
              descricao={`${resumo.finalizadas} decisão(ões) concluída(s)`}
              destaque="informativo"
            />

            <CardIndicador
              titulo="Lucro acumulado"
              valor={formatarUnidades(
                resumo.lucroAcumulado
              )}
              descricao="Resultado teórico"
              destaque={
                resumo.lucroAcumulado >=
                0
                  ? "positivo"
                  : "negativo"
              }
            />

            <CardIndicador
              titulo="Melhor mercado"
              valor={
                melhorMercado
                  ?.nome ??
                "Sem dados"
              }
              descricao={
                melhorMercado
                  ? `${formatarPercentual(
                      melhorMercado
                        .taxaAcerto
                    )} de acerto`
                  : "Nenhum resultado disponível"
              }
            />
          </div>
        </article>
      </div>
    </section>
  );
}
