"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem(traduzirErro(error.message));
      setCarregando(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  function traduzirErro(erro: string) {
    if (erro.toLowerCase().includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (erro.toLowerCase().includes("email not confirmed")) {
      return "Confirme seu e-mail antes de entrar.";
    }

    return erro;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-600">FinControl</h1>

          <p className="mt-2 text-sm text-zinc-400">
            Entre para acessar seu controle financeiro
          </p>
        </div>

        <form onSubmit={fazerLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Senha
            </label>

            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-600"
            />
          </div>

          {mensagem && (
            <div className="rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Ainda não possui uma conta?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-red-500 hover:text-red-400"
          >
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}