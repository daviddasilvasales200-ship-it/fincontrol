import { redirect } from "next/navigation";

import PaginaAssinaturas from "@/components/assinaturas/pagina-assinaturas";
import { createClient } from "@/lib/supabase/server";

export default async function AssinaturasPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <PaginaAssinaturas />;
}