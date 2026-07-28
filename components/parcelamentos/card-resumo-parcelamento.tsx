type CardResumoParcelamentoProps = {
  titulo: string;
  valor?: number;
  quantidade?: number;
  descricao?: string;
  icone?: string;
  destaque?: "positivo" | "negativo" | "neutro";
};

function formatarMoeda(valor: number) {
  const valorSeguro = Number.isFinite(valor) ? valor : 0;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valorSeguro);
}

export default function CardResumoParcelamento({
  titulo,
  valor,
  quantidade,
  descricao,
  icone = "▦",
  destaque = "neutro",
}: CardResumoParcelamentoProps) {
  const estilos = {
    positivo: {
      icone:
        "border-emerald-900/70 bg-emerald-950/50 text-emerald-400",
      valor: "text-emerald-400",
    },
    negativo: {
      icone:
        "border-red-900/70 bg-red-950/50 text-red-400",
      valor: "text-red-400",
    },
    neutro: {
      icone:
        "border-zinc-700 bg-zinc-900 text-zinc-300",
      valor: "text-white",
    },
  };

  const estiloAtual = estilos[destaque];

  const valorPrincipal =
    typeof valor === "number"
      ? formatarMoeda(valor)
      : String(quantidade ?? 0);

  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg shadow-black/20 transition hover:border-zinc-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">
            {titulo}
          </p>

          <p
            className={`mt-3 break-words text-2xl font-bold tracking-tight ${estiloAtual.valor}`}
          >
            {valorPrincipal}
          </p>

          {descricao && (
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {descricao}
            </p>
          )}
        </div>

        <div
          aria-hidden="true"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg ${estiloAtual.icone}`}
        >
          {icone}
        </div>
      </div>
    </article>
  );
}