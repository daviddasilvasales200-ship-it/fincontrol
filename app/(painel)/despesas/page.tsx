import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormularioMovimentacao from "@/components/formulario-movimentacao";
import AcoesMovimentacao from "@/components/acoes-movimentacao";

function formatarMoeda(valor: number | string) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function DespesasPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: despesas, error } = await supabase
    .from("movimentacoes")
    .select(
      "id, tipo, descricao, categoria, valor, data, observacao, created_at"
    )
    .eq("user_id", user.id)
    .eq("tipo", "despesa")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  const totalDespesas =
    despesas?.reduce(
      (total, despesa) => total + Number(despesa.valor),
      0
    ) ?? 0;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-red-500">
              FinControl
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              Despesas
            </h1>

            <p className="mt-2 text-zinc-400">
              Cadastre, edite e acompanhe todos os seus gastos.
            </p>
          </div>


        </header>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Total de despesas cadastradas
          </p>

          <p className="mt-2 text-3xl font-bold text-red-500">
            {formatarMoeda(totalDespesas)}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <FormularioMovimentacao
            tipo="despesa"
            userId={user.id}
          />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">
              Despesas cadastradas
            </h2>

            {error && (
              <div className="mt-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-400">
                Erro ao carregar despesas: {error.message}
              </div>
            )}

            {!error && !despesas?.length ? (
              <div className="mt-8 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                <p className="text-zinc-300">
                  Nenhuma despesa cadastrada.
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Use o formulário para adicionar sua primeira despesa.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {despesas?.map((despesa) => (
                  <article
                    key={despesa.id}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {despesa.descricao}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {despesa.categoria} ·{" "}
                          {new Date(
                            `${despesa.data}T12:00:00`
                          ).toLocaleDateString("pt-BR")}
                        </p>

                        {despesa.observacao && (
                          <p className="mt-2 break-words text-sm text-zinc-600">
                            {despesa.observacao}
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-lg font-bold text-red-500">
                        - {formatarMoeda(despesa.valor)}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-zinc-800 pt-4">
                      <AcoesMovimentacao
                        movimentacao={{
                          id: despesa.id,
                          tipo: "despesa",
                          descricao: despesa.descricao,
                          categoria: despesa.categoria,
                          valor: despesa.valor,
                          data: despesa.data,
                          observacao: despesa.observacao,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}