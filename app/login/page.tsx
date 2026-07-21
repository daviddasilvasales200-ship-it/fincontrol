"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PaginaLogin() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [manterConectado, setManterConectado] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMensagem("");

    const emailTratado = email.trim().toLowerCase();

    if (!emailTratado) {
      setMensagem("Digite seu e-mail.");
      return;
    }

    if (!senha) {
      setMensagem("Digite sua senha.");
      return;
    }

    setCarregando(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailTratado,
        password: senha,
      });

      if (error) {
        const erroTratado = error.message.toLowerCase();

        if (erroTratado.includes("invalid login")) {
          setMensagem("E-mail ou senha incorretos.");
          return;
        }

        if (erroTratado.includes("email not confirmed")) {
          setMensagem(
            "Confirme seu e-mail antes de acessar o FinControl."
          );
          return;
        }

        setMensagem(error.message);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (erro) {
      console.error("Erro inesperado no login:", erro);

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-44 top-1/4 h-96 w-96 rounded-full bg-red-600/10 blur-[140px]" />
        <div className="absolute -bottom-48 right-0 h-[420px] w-[420px] rounded-full bg-red-950/30 blur-[150px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden min-h-screen items-center justify-center border-r border-zinc-900 px-10 lg:flex xl:px-16">
          <div className="w-full max-w-lg">
            <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
              <div className="relative mb-10">
                <div className="absolute inset-0 rounded-full bg-red-600/20 blur-3xl" />

                <div className="relative flex h-64 w-64 items-end justify-center gap-4 rounded-[2.5rem] border border-red-900/40 bg-gradient-to-b from-zinc-950 to-black p-10 shadow-2xl shadow-red-950/30">
                  <Barra altura="h-16" atraso="delay-75" />
                  <Barra altura="h-24" atraso="delay-150" />
                  <Barra altura="h-32" atraso="delay-300" />
                  <Barra altura="h-40" atraso="delay-500" />
                </div>

                <div className="absolute -bottom-4 left-1/2 h-8 w-40 -translate-x-1/2 rounded-full bg-red-600/20 blur-2xl" />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-5xl font-black tracking-tight text-white xl:text-6xl">
                  Fin
                </span>

                <span className="text-5xl font-black tracking-tight text-red-500 xl:text-6xl">
                  Control
                </span>
              </div>

              <p className="mt-6 text-2xl font-semibold tracking-tight text-white">
                Seu dinheiro organizado.
              </p>

              <p className="mt-4 max-w-md text-base leading-7 text-zinc-500">
                Controle receitas, despesas, parcelamentos e
                assinaturas em uma única plataforma.
              </p>

              <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-400">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)]" />
                Controle financeiro inteligente
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <div className="mb-5 flex items-end gap-2">
                <div className="h-8 w-3 rounded-md bg-red-900" />
                <div className="h-12 w-3 rounded-md bg-red-700" />
                <div className="h-16 w-3 rounded-md bg-red-600" />
                <div className="h-20 w-3 rounded-md bg-red-500" />
              </div>

              <p className="text-3xl font-black tracking-tight">
                <span className="text-white">Fin</span>
                <span className="text-red-500">Control</span>
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/85 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
              <header>
                <p className="text-sm font-semibold text-red-500">
                  Bem-vindo de volta
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  Acesse sua conta
                </h1>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Entre para acompanhar suas finanças e seus gastos
                  mensais.
                </p>
              </header>

              <form onSubmit={entrar} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-zinc-300"
                  >
                    E-mail
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                      <IconeEmail />
                    </span>

                    <input
                      id="email"
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

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label
                      htmlFor="senha"
                      className="text-sm font-medium text-zinc-300"
                    >
                      Senha
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setMensagem(
                          "A recuperação de senha será configurada na próxima etapa."
                        )
                      }
                      className="text-xs font-semibold text-red-500 transition hover:text-red-400"
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                      <IconeCadeado />
                    </span>

                    <input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={senha}
                      onChange={(event) =>
                        setSenha(event.target.value)
                      }
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-zinc-700 bg-black py-3.5 pl-12 pr-12 text-white outline-none transition placeholder:text-zinc-700 hover:border-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setMostrarSenha((estadoAtual) => !estadoAtual)
                      }
                      aria-label={
                        mostrarSenha
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                      className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
                    >
                      {mostrarSenha ? (
                        <IconeOlhoFechado />
                      ) : (
                        <IconeOlho />
                      )}
                    </button>
                  </div>
                </div>

                <label className="flex w-fit cursor-pointer items-center gap-3 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={manterConectado}
                    onChange={(event) =>
                      setManterConectado(event.target.checked)
                    }
                    className="h-4 w-4 accent-red-600"
                  />

                  Manter minha conta conectada
                </label>

                {mensagem && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-900/70 bg-red-950/30 p-4 text-sm leading-6 text-red-400"
                  >
                    {mensagem}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={carregando}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-500 hover:shadow-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Entrando...
                    </>
                  ) : (
                    <>
                      Entrar
                      <span className="transition group-hover:translate-x-1">
                        <IconeSeta />
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-zinc-800 pt-6 text-center">
                <p className="text-sm text-zinc-500">
                  Ainda não possui uma conta?{" "}
                  <Link
                    href="/cadastro"
                    className="font-semibold text-red-500 transition hover:text-red-400"
                  >
                    Criar conta
                  </Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-zinc-700">
              Ao acessar, você concorda com os termos de uso e a
              política de privacidade do FinControl.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Barra({
  altura,
  atraso,
}: {
  altura: string;
  atraso: string;
}) {
  return (
    <div
      className={`w-8 origin-bottom animate-[crescerBarra_700ms_ease-out_forwards] rounded-t-2xl bg-gradient-to-t from-red-800 via-red-600 to-red-400 opacity-0 shadow-[0_0_28px_rgba(239,68,68,0.26)] ${altura} ${atraso}`}
    />
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

function IconeCadeado() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 10V7a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeOlho() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function IconeOlhoFechado() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="m3 3 18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a15 15 0 0 1-3 3.7M6.2 6.2C3.8 8 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3.3-.6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeSeta() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M5 12h14m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}