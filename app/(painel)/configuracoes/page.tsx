import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormularioPerfil from "@/components/formulario-perfil";

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const nomeInicial =
    typeof user.user_metadata?.nome === "string" &&
    user.user_metadata.nome.trim()
      ? user.user_metadata.nome.trim()
      : "Usuário";

  const avatarInicial =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "";

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
            Configurações
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Meu perfil
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Personalize o nome e a foto exibidos no
            Dashboard Premium e nas demais áreas do
            FinControl.
          </p>
        </header>

        <FormularioPerfil
          userId={user.id}
          email={user.email ?? ""}
          nomeInicial={nomeInicial}
          avatarInicial={avatarInicial}
        />
      </div>
    </main>
  );
}