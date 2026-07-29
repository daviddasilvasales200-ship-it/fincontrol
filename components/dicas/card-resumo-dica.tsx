type DestaqueCardResumoDica =
  | "neutro"
  | "positivo"
  | "negativo"
  | "atencao";

type CardResumoDicaProps = {
  titulo: string;
  descricao: string;
  icone?: string;
  quantidade?: number;
  percentual?: number;
  destaque?: DestaqueCardResumoDica;
};

function formatarPercentual(valor: number) {
  const valorSeguro = Number.isFinite(valor)
    ? valor
    : 0;

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(valorSeguro);
}

function obterClassesDestaque(
  destaque: DestaqueCardResumoDica
) {
  if (destaque === "positivo") {
    return {
      borda:
        "border-emerald-900/70 hover:border-emerald-800",
      fundoIcone:
        "border-emerald-900/70 bg-emerald-950/50",
      textoIcone: "text-emerald-400",
      textoValor: "text-emerald-400",
    };
  }

  if (destaque === "negativo") {
    return {
      borda:
        "border-red-900/70 hover:border-red-800",
      fundoIcone:
        "border-red-900/70 bg-red-950/50",
      textoIcone: "text-red-400",
      textoValor: "text-red-400",
    };
  }

  if (destaque === "atencao") {
    return {
      borda:
        "border-amber-900/70 hover:border-amber-800",
      fundoIcone:
        "border-amber-900/70 bg-amber-950/50",
      textoIcone: "text-amber-400",
      textoValor: "text-amber-400",
    };
  }

  return {
    borda:
      "border-zinc-800 hover:border-zinc-700",
    fundoIcone:
      "border-zinc-800 bg-zinc-900",
    textoIcone: "text-zinc-400",
    textoValor: "text-white",
  };
}

export default function CardResumoDica({
  titulo,
  descricao,
  icone = "◆",
  quantidade,
  percentual,
  destaque = "neutro",
}: CardResumoDicaProps) {
  const classes =
    obterClassesDestaque(destaque);

  const possuiPercentual =
    typeof percentual === "number";

  const valorPrincipal =
    typeof quantidade === "number"
      ? quantidade
      : 0;

  return (
    <article
      className={`rounded-2xl border bg-zinc-950 p-5 shadow-lg shadow-black/20 transition ${classes.borda}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500">
            {titulo}
          </p>

          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${classes.textoValor}`}
          >
            {possuiPercentual
              ? `${formatarPercentual(
                  percentual
                )}%`
              : valorPrincipal}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-base font-bold ${classes.fundoIcone} ${classes.textoIcone}`}
          aria-hidden="true"
        >
          {icone}
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-zinc-600">
        {descricao}
      </p>
    </article>
  );
}