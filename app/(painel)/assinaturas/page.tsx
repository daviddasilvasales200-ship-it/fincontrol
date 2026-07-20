import FormularioAssinatura from "@/components/formulario-assinatura";
import ItemAssinatura from "@/components/item-assinatura";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function PaginaAssinaturas() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: assinaturas, error } = await supabase
    .from("assinaturas")
    .select(
      `
        id,
        nome,
        categoria,
        valor,
        dia_vencimento,
        data_inicio,
        observacao,
        ativa,
        created_at
      `
    )
    .eq("user_id", user.id)
    .order("ativa", { ascending: false })
    .order("dia_vencimento", { ascending: true });

  if (error) {
    console.error("Erro ao carregar assinaturas:", error);
  }

  const listaAssinaturas = assinaturas ?? [];

  const assinaturasAtivas = listaAssinaturas.filter(
    (assinatura) => assinatura.ativa
  );

  const assinaturasInativas = listaAssinaturas.filter(
    (assinatura) => !assinatura.ativa
  );

  const totalMensal = assinaturasAtivas.reduce(
    (total, assinatura) => total + Number(assinatura.valor),
    0
  );

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  return (
    <main className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-red-500">
          Gastos recorrentes
        </p>

        <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Assinaturas
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Controle serviços como Netflix, Amazon Prime, Spotify,
          academia e outros pagamentos mensais.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">
            Custo mensal
          </p>

          <p className="mt-2 text-2xl font-bold text-white">
            {formatarMoeda(totalMensal)}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            Soma das assinaturas ativas
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">
            Assinaturas ativas
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {assinaturasAtivas.length}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            Serviços gerando cobranças
          </p>
        </article>

        <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-sm text-zinc-500">
            Assinaturas inativas
          </p>

          <p className="mt-2 text-2xl font-bold text-zinc-400">
            {assinaturasInativas.length}
          </p>

          <p className="mt-2 text-xs text-zinc-600">
            Serviços pausados ou cancelados
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[400px_minmax(0,1fr)]">
        <FormularioAssinatura userId={user.id} />

        <div className="min-w-0 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
          <header>
            <p className="text-sm font-semibold text-red-500">
              Serviços cadastrados
            </p>

            <h2 className="mt-1 text-xl font-semibold text-white">
              Minhas assinaturas
            </h2>
          </header>

          {listaAssinaturas.length === 0 ? (
            <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-black/40 px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10 text-2xl">
                📺
              </div>

              <h3 className="mt-4 font-semibold text-white">
                Nenhuma assinatura cadastrada
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                Use o formulário para adicionar sua primeira
                assinatura recorrente.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {listaAssinaturas.map((assinatura) => (
                <ItemAssinatura
                  key={assinatura.id}
                  assinatura={assinatura}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}