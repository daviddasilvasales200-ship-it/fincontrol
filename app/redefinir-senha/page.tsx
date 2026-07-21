"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PaginaRedefinirSenha() {
  const router = useRouter();
  const supabase = createClient();

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const [sessaoRecuperacao, setSessaoRecuperacao] =
    useState(false);

  const [verificando, setVerificando] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    let componenteMontado = true;

    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!componenteMontado) return;

      if (session) {
        setSessaoRecuperacao(true);
      }

      setVerificando(false);
    }

    verificarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!componenteMontado) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setSessaoRecuperacao(true);
        setVerificando(false);
      }
    });

    return () => {
      componenteMontado = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function atualizarSenha(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);

    if (senha.length < 8) {
      setMensagem(
        "A nova senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas informadas não são iguais.");
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        console.error("Erro ao atualizar senha:", error);

        setMensagem(
          "Não foi possível atualizar a senha. Solicite um novo link de recuperação."
        );

        return;
      }

      setSucesso(true);

      setMensagem(
        "Senha atualizada com sucesso. Você será direcionado para o login."
      );

      await supabase.auth.signOut();

      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1800);
    } catch (erro) {
      console.error(
        "Erro inesperado ao atualizar senha:",
        erro
      );

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível atualizar a senha."
      );
    } finally {
      setCarregando(false);
    }
  }

  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-500/30 border-t-red-500" />
          Validando link de recuperação...
        </div>
      </main>
    );
  }

  if (!sessaoRecuperacao) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-950 text-xl text-red-500">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold">
            Link inválido ou expirado
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Solicite um novo link para redefinir sua senha.
          </p>

          <Link
            href="/recuperar-senha"
            className="mt-6 inline-flex rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
          >
            Solicitar novo link
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[140px]" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-red-950/30 blur-[140px]" />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
        <header>
          <p className="text-sm font-semibold text-red-500">
            Segurança da conta
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Crie uma nova senha
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Escolha uma senha segura com pelo menos 8 caracteres.
          </p>
        </header>

        <form
          onSubmit={atualizarSenha}
          className="mt-8 space-y-5"
        >
          <CampoSenha
            id="nova-senha"
            label="Nova senha"
            value={senha}
            onChange={setSenha}
            mostrar={mostrarSenha}
            onAlternarVisibilidade={() =>
              setMostrarSenha((estado) => !estado)
            }
          />

          <CampoSenha
            id="confirmar-nova-senha"
            label="Confirmar nova senha"
            value={confirmarSenha}
            onChange={setConfirmarSenha}
            mostrar={mostrarSenha}
            onAlternarVisibilidade={() =>
              setMostrarSenha((estado) => !estado)
            }
          />

          <IndicadorSenha senha={senha} />

          {mensagem && (
            <div
              role="alert"
              className={`rounded-xl border p-4 text-sm leading-6 ${
                sucesso
                  ? "border-emerald-900/70 bg-emerald-950/30 text-emerald-400"
                  : "border-red-900/70 bg-red-950/30 text-red-400"
              }`}
            >
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || sucesso}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Atualizando senha...
              </>
            ) : (
              "Salvar nova senha"
            )}
          </button>
        </form>
      </section>
    </main>
  );
}

type CampoSenhaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  mostrar: boolean;
  onAlternarVisibilidade: () => void;
};

function CampoSenha({
  id,
  label,
  value,
  onChange,
  mostrar,
  onAlternarVisibilidade,
}: CampoSenhaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={mostrar ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Digite sua nova senha"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3.5 pr-12 text-white outline-none transition placeholder:text-zinc-700 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
        />

        <button
          type="button"
          onClick={onAlternarVisibilidade}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
          aria-label={mostrar ? "Ocultar senha" : "Mostrar senha"}
        >
          {mostrar ? "🙈" : "👁"}
        </button>
      </div>
    </div>
  );
}

function IndicadorSenha({ senha }: { senha: string }) {
  const criterios = [
    senha.length >= 8,
    /[A-Z]/.test(senha),
    /[a-z]/.test(senha),
    /\d/.test(senha),
    /[^A-Za-z0-9]/.test(senha),
  ];

  const pontos = criterios.filter(Boolean).length;

  const largura =
    pontos === 0
      ? "w-0"
      : pontos === 1
        ? "w-1/5"
        : pontos === 2
          ? "w-2/5"
          : pontos === 3
            ? "w-3/5"
            : pontos === 4
              ? "w-4/5"
              : "w-full";

  const cor =
    pontos <= 2
      ? "bg-red-600"
      : pontos <= 4
        ? "bg-amber-500"
        : "bg-emerald-500";

  const texto =
    pontos <= 2
      ? "Senha fraca"
      : pontos <= 4
        ? "Senha média"
        : "Senha forte";

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${largura} ${cor}`}
        />
      </div>

      <p className="mt-2 text-xs text-zinc-500">
        {texto}: use letras maiúsculas, minúsculas, números e
        símbolos.
      </p>
    </div>
  );
}