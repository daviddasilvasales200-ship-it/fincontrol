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

export default async function ReceitasPage() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: receitas, error } = await supabase
    .from("movimentacoes")
    .select(
      "id, tipo, descricao, categoria, valor, data, observacao, created_at"
    )
    .eq("user_id", userId)
    .eq("tipo", "receita")
    .order("data", { ascending: false })
    .order("created_at", { ascending: false });

  const totalReceitas =
    receitas?.reduce(
      (total, receita) => total + Number(receita.valor),
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
              Receitas
            </h1>

            <p className="mt-2 text-zinc-400">
              Cadastre, edite e acompanhe todos os seus ganhos.
            </p>
          </div>
        </header>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-sm text-zinc-400">
            Total de receitas cadastradas
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-500">
            {formatarMoeda(totalReceitas)}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <FormularioMovimentacao
            tipo="receita"
            userId={userId}
          />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">
              Receitas cadastradas
            </h2>

            {error && (
              <div className="mt-6 rounded-xl border border-red-800 bg-red-950/40 p-4 text-sm text-red-400">
                Erro ao carregar receitas: {error.message}
              </div>
            )}

            {!error && !receitas?.length ? (
              <div className="mt-8 rounded-xl border border-dashed border-zinc-800 py-16 text-center">
                <p className="text-zinc-300">
                  Nenhuma receita cadastrada.
                </p>

                <p className="mt-2 text-sm text-zinc-600">
                  Use o formulário para adicionar sua primeira receita.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {receitas?.map((receita) => (
                  <article
                    key={receita.id}
                    className="rounded-xl border border-zinc-800 bg-black p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {receita.descricao}
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          {receita.categoria} ·{" "}
                          {new Date(
                            `${receita.data}T12:00:00`
                          ).toLocaleDateString("pt-BR")}
                        </p>

                        {receita.observacao && (
                          <p className="mt-2 break-words text-sm text-zinc-600">
                            {receita.observacao}
                          </p>
                        )}
                      </div>

                      <p className="shrink-0 text-lg font-bold text-emerald-500">
                        + {formatarMoeda(receita.valor)}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end border-t border-zinc-800 pt-4">
                      <AcoesMovimentacao
                        movimentacao={{
                          id: receita.id,
                          tipo: "receita",
                          descricao: receita.descricao,
                          categoria: receita.categoria,
                          valor: receita.valor,
                          data: receita.data,
                          observacao: receita.observacao,
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