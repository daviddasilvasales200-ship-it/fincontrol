import {
  formatarPercentualHistorico,
  formatarUnidadesHistorico,
} from "@/types/historico-dicas";

import type {
  DesempenhoAgrupado,
} from "@/types/historico-dicas";

type TabelaDesempenhoDicasProps = {
  titulo: string;
  descricao: string;
  itens: DesempenhoAgrupado[];
  vazioTexto?: string;
};

function obterClasseResultado(
  valor: number
) {
  if (valor > 0) {
    return "text-emerald-400";
  }

  if (valor < 0) {
    return "text-red-400";
  }

  return "text-zinc-400";
}

function obterClasseTaxa(
  taxa: number
) {
  if (taxa >= 60) {
    return "text-emerald-400";
  }

  if (taxa > 0) {
    return "text-amber-400";
  }

  return "text-zinc-500";
}

export default function TabelaDesempenhoDicas({
  titulo,
  descricao,
  itens,
  vazioTexto =
    "Ainda não existem dados suficientes.",
}: TabelaDesempenhoDicasProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
        <h2 className="text-lg font-bold text-white">
          {titulo}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {descricao}
        </p>
      </div>

      {itens.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-xl">
            ◫
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            {vazioTexto}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-black/40 text-left">
                <th className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Nome
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Total
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Ganhas
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Perdidas
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Anuladas
                </th>

                <th className="whitespace-nowrap px-4 py-4 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Taxa
                </th>

                <th className="whitespace-nowrap px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Lucro
                </th>
              </tr>
            </thead>

            <tbody>
              {itens.map((item) => (
                <tr
                  key={item.nome}
                  className="border-b border-zinc-900 transition last:border-b-0 hover:bg-zinc-900/40"
                >
                  <td className="min-w-56 px-5 py-4">
                    <p className="font-semibold text-zinc-200">
                      {item.nome}
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      {item.finalizadas} resultado(s)
                      considerado(s)
                    </p>
                  </td>

                  <td className="px-4 py-4 text-center text-sm font-semibold text-zinc-300">
                    {item.total}
                  </td>

                  <td className="px-4 py-4 text-center text-sm font-semibold text-emerald-400">
                    {item.ganhas}
                  </td>

                  <td className="px-4 py-4 text-center text-sm font-semibold text-red-400">
                    {item.perdidas}
                  </td>

                  <td className="px-4 py-4 text-center text-sm font-semibold text-zinc-400">
                    {item.anuladas}
                  </td>

                  <td
                    className={`px-4 py-4 text-center text-sm font-semibold ${obterClasseTaxa(
                      item.taxaAcerto
                    )}`}
                  >
                    {formatarPercentualHistorico(
                      item.taxaAcerto
                    )}
                  </td>

                  <td
                    className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${obterClasseResultado(
                      item.lucroPrejuizo
                    )}`}
                  >
                    {formatarUnidadesHistorico(
                      item.lucroPrejuizo
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}