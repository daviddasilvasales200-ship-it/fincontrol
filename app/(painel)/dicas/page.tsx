import { redirect } from "next/navigation";

import PaginaDicas from "@/components/dicas/pagina-dicas";
import { createClient } from "@/lib/supabase/server";

export default async function DicasPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return <PaginaDicas />;
}