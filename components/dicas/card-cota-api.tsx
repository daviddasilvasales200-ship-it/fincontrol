"use client";

type StatusCota =
  | "disponivel"
  | "atencao"
  | "critica"
  | "esgotada"
  | "desconhecida";

export type DadosCotaApi = {
  sucesso: boolean;

  plano: string;
  assinaturaAtiva: boolean;
  fimAssinatura: string | null;

  usadasHoje: number;
  limiteDiario: number;
  restantesHoje: number;

  percentualUsado: number;
  percentualRestante: number;

  statusCota: StatusCota;

  limiteDiarioHeader: number | null;
  restanteDiarioHeader: number | null;

  limiteMinuto: number | null;
  restanteMinuto: number | null;

  consultadoEm: string;
};

type CardCotaApiProps = {
  dados: DadosCotaApi | null;
  carregando?: boolean;
  erro?: string;
  onAtualizar: () => Promise<void> | void;
};

function formatarDataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function limitarPercentual(valor: number) {
  if (!Number.isFinite(valor)) {
    return 0;
  }

  return Math.min(
    Math.max(valor, 0),
    100
  );
}

function obterConfiguracaoStatus(
  status: StatusCota
) {
  if (status === "disponivel") {
    return {
      titulo: "Cota disponível",
      descricao:
        "A API possui saldo suficiente para novas consultas.",
      classesStatus:
        "border-emerald-900/70 bg-emerald-950/40 text-emerald-400",
      classesBarra:
        "bg-emerald-500",
      classesNumero:
        "text-emerald-400",
    };
  }

  if (status === "atencao") {
    return {
      titulo: "Cota em atenção",
      descricao:
        "O saldo diário está diminuindo. Evite atualizações desnecessárias.",
      classesStatus:
        "border-amber-900/70 bg-amber-950/40 text-amber-400",
      classesBarra:
        "bg-amber-500",
      classesNumero:
        "text-amber-400",
    };
  }

  if (status === "critica") {
    return {
      titulo: "Cota crítica",
      descricao:
        "Restam poucas requisições disponíveis para hoje.",
      classesStatus:
        "border-orange-900/70 bg-orange-950/40 text-orange-400",
      classesBarra:
        "bg-orange-500",
      classesNumero:
        "text-orange-400",
    };
  }

  if (status === "esgotada") {
    return {
      titulo: "Cota esgotada",
      descricao:
        "Não existem requisições disponíveis até a renovação do limite.",
      classesStatus:
        "border-red-900/70 bg-red-950/40 text-red-400",
      classesBarra:
        "bg-red-500",
      classesNumero:
        "text-red-400",
    };
  }

  return {
    titulo: "Cota desconhecida",
    descricao:
      "Não foi possível determinar o saldo atual da API.",
    classesStatus:
      "border-zinc-700 bg-zinc-900 text-zinc-400",
    classesBarra:
      "bg-zinc-500",
    classesNumero:
      "text-zinc-300",
  };
}

function EstadoCarregando() {
  return (
    <section className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="h-4 w-44 rounded bg-zinc-800" />

          <div className="mt-3 h-8 w-64 rounded bg-zinc-800" />

          <div className="mt-3 h-4 w-full max-w-lg rounded bg-zinc-900" />
        </div>

        <div className="h-10 w-36 rounded-xl bg-zinc-800" />
      </div>

      <div className="mt-6 h-3 rounded-full bg-zinc-900" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, indice) => (
          <div
            key={indice}
            className="h-24 rounded-xl bg-zinc-900"
          />
        ))}
      </div>
    </section>
  );
}

export default function CardCotaApi({
  dados,
  carregando = false,
  erro = "",
  onAtualizar,
}: CardCotaApiProps) {
  if (carregando && !dados) {
    return <EstadoCarregando />;
  }

  if (!dados) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              API-Football
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Cota da API indisponível
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              {erro ||
                "Não foi possível carregar as informações da cota."}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void onAtualizar()
            }
            disabled={carregando}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-zinc-700 px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span
              className={
                carregando
                  ? "animate-spin"
                  : ""
              }
            >
              ↻
            </span>

            {carregando
              ? "Consultando..."
              : "Consultar cota"}
          </button>
        </div>
      </section>
    );
  }

  const configuracao =
    obterConfiguracaoStatus(
      dados.statusCota
    );

  const percentualUsado =
    limitarPercentual(
      dados.percentualUsado
    );

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-500">
              API-Football
            </p>

            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${configuracao.classesStatus}`}
            >
              {configuracao.titulo}
            </span>

            <span className="inline-flex rounded-full border border-zinc-700 bg-black px-3 py-1 text-xs font-semibold text-zinc-400">
              Plano: {dados.plano}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-bold text-white">
            Monitoramento da cota
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {configuracao.descricao}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void onAtualizar()
          }
          disabled={carregando}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-black px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            aria-hidden="true"
            className={
              carregando
                ? "animate-spin"
                : ""
            }
          >
            ↻
          </span>

          {carregando
            ? "Atualizando..."
            : "Atualizar cota"}
        </button>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-400">
            Consumo diário
          </p>

          <p
            className={`text-sm font-bold ${configuracao.classesNumero}`}
          >
            {percentualUsado.toLocaleString(
              "pt-BR",
              {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }
            )}
            %
          </p>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-black">
          <div
            className={`h-full rounded-full transition-all duration-500 ${configuracao.classesBarra}`}
            style={{
              width:
                `${percentualUsado}%`,
            }}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-600">
          <span>
            {dados.usadasHoje} utilizada(s)
          </span>

          <span>
            {dados.restantesHoje} restante(s)
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-black p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Usadas hoje
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {dados.usadasHoje}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Requisições realizadas
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Restantes hoje
          </p>

          <p
            className={`mt-2 text-2xl font-bold ${configuracao.classesNumero}`}
          >
            {dados.restantesHoje}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            De {dados.limiteDiario} disponíveis
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Limite por minuto
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {dados.limiteMinuto ??
              "—"}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Restante agora:{" "}
            {dados.restanteMinuto ??
              "não informado"}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-black p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
            Última consulta
          </p>

          <p className="mt-2 text-sm font-semibold text-zinc-300">
            {formatarDataHora(
              dados.consultadoEm
            )}
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Assinatura{" "}
            {dados.assinaturaAtiva
              ? "ativa"
              : "inativa"}
          </p>
        </div>
      </div>

      {dados.statusCota ===
        "esgotada" && (
        <div className="mt-5 rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-300">
          A cota diária está esgotada. Os
          botões de consulta ficarão
          bloqueados até a renovação do
          limite.
        </div>
      )}

      {erro && (
        <div className="mt-5 rounded-xl border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          A última tentativa de atualizar
          a cota apresentou um erro:{" "}
          {erro}
        </div>
      )}
    </section>
  );
}