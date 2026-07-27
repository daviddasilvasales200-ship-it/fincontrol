import { redirect } from "next/navigation";

import PaginaMovimentacoes from "@/components/financeiro/pagina-movimentacoes";
import { createClient } from "@/lib/supabase/server";

export default async function ReceitasPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <PaginaMovimentacoes tipo="receita" />;
}