"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const [carregando, setCarregando] = useState(false);

  async function sair() {
    setCarregando(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error.message);
      setCarregando(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={carregando}
      className="rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-600 hover:text-white disabled:opacity-60"
    >
      {carregando ? "Saindo..." : "Sair"}
    </button>
  );
}