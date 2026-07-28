import { redirect } from "next/navigation";

import PaginaParcelamentos from "@/components/parcelamentos/pagina-parcelamentos";
import { createClient } from "@/lib/supabase/server";

export default async function ParcelamentosPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <PaginaParcelamentos />;
}