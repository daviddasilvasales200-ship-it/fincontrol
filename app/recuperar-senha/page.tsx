"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PaginaRecuperarSenha() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [sucesso, setSucesso] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function enviarLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado) {
      setMensagem("Digite o e-mail da sua conta.");
      return;
    }

    setCarregando(true);

    try {
      const origem =
        typeof window !== "undefined"
          ? window.location.origin
          : "";

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          emailTratado,
          {
            redirectTo: `${origem}/redefinir-senha`,
          }
        );

      if (error) {
        console.error(
          "Erro ao enviar recuperação de senha:",
          error
        );

        setMensagem(
          "Não foi possível enviar o link. Verifique o e-mail e tente novamente."
        );

        return;
      }

      setSucesso(true);

      setMensagem(
        "Enviamos um link de recuperação. Verifique sua caixa de entrada e a pasta de spam."
      );
    } catch (erro) {
      console.error(
        "Erro inesperado na recuperação de senha:",
        erro
      );

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível enviar o link de recuperação."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[140px]" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-red-950/30 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      <section className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
        <div className="flex justify-center">
          <LogoFinControl />
        </div>

        <header className="mt-6 text-center">
          <p className="text-sm font-semibold text-red-500">
            Recuperação de acesso
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Esqueceu sua senha?
          </h1>

          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Informe o e-mail cadastrado e enviaremos um link para
            você criar uma nova senha.
          </p>
        </header>

        <form onSubmit={enviarLink} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email-recuperacao"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              E-mail
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                <IconeEmail />
              </span>

              <input
                id="email-recuperacao"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="seuemail@exemplo.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-zinc-700 bg-black py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-700 hover:border-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
              />
            </div>
          </div>

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
            disabled={carregando}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Enviando...
              </>
            ) : (
              "Enviar link de recuperação"
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-zinc-800 pt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-400"
          >
            <span aria-hidden="true">←</span>
            Voltar para o login
          </Link>
        </div>
      </section>
    </main>
  );
}

function LogoFinControl() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-20 w-20 items-end justify-center gap-1.5 rounded-2xl border border-red-900/50 bg-gradient-to-b from-zinc-950 to-black p-4 shadow-lg shadow-red-950/30">
        <span className="h-5 w-2.5 rounded-t bg-red-700" />
        <span className="h-8 w-2.5 rounded-t bg-red-600" />
        <span className="h-11 w-2.5 rounded-t bg-red-500" />
        <span className="h-14 w-2.5 rounded-t bg-red-400" />
      </div>

      <p className="text-2xl font-black tracking-tight">
        <span className="text-white">Fin</span>
        <span className="text-red-500">Control</span>
      </p>
    </div>
  );
}

function IconeEmail() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m5 7 7 6 7-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}