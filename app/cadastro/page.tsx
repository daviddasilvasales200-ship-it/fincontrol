"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CadastroPage() {
  const router = useRouter();
const supabase = createClient();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function criarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não são iguais.");
      return;
    }

    if (senha.length < 6) {
      setMensagem("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome,
        },
      },
    });

    if (error) {
      setMensagem(traduzirErro(error.message));
      setCarregando(false);
      return;
    }

    setSucesso(true);

    if (data.session) {
      router.replace("/dashboard");
      router.refresh();
      return;
    }

    setMensagem(
      "Conta criada! Verifique seu e-mail para confirmar o cadastro."
    );

    setCarregando(false);
  }

  function traduzirErro(erro: string) {
    const texto = erro.toLowerCase();

    if (texto.includes("already registered")) {
      return "Este e-mail já está cadastrado.";
    }

    if (texto.includes("password")) {
      return "A senha informada não atende aos requisitos.";
    }

    if (texto.includes("email")) {
      return "Digite um endereço de e-mail válido.";
    }

    return erro;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-red-600">FinControl</h1>

          <p className="mt-2 text-sm text-zinc-400">
            Crie sua conta para começar
          </p>
        </div>

        <form onSubmit={criarConta} className="space-y-5">
          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Nome
            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-600"
            />
          </div>

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
              placeholder="Mínimo de 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-600"
            />
          </div>

          <div>
            <label
              htmlFor="confirmarSenha"
              className="mb-2 block text-sm font-medium text-zinc-200"
            >
              Confirmar senha
            </label>

            <input
              id="confirmarSenha"
              type="password"
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Digite a senha novamente"
              autoComplete="new-password"
              minLength={6}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-red-600"
            />
          </div>

          {mensagem && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                sucesso
                  ? "border-green-900 bg-green-950/40 text-green-400"
                  : "border-red-900 bg-red-950/40 text-red-400"
              }`}
            >
              {mensagem}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já possui uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-red-500 hover:text-red-400"
          >
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}