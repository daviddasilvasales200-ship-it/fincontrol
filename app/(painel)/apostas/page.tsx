import { redirect } from "next/navigation";

import PaginaApostas from "@/components/apostas/pagina-apostas";
import { createClient } from "@/lib/supabase/server";

export default async function ApostasPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <PaginaApostas />;
}