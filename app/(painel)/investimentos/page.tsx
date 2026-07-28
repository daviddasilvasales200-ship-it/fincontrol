import { redirect } from "next/navigation";

import PaginaInvestimentos from "@/components/investimentos/pagina-investimentos";
import { createClient } from "@/lib/supabase/server";

export default async function InvestimentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <PaginaInvestimentos />;
}