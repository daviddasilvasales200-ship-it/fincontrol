"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

import {
  calcularResumoBanca,
  formatarDataInicioBanca,
  formatarMoedaBanca,
  formatarPercentualBanca,
} from "@/types/banca";

import type {
  ApostaParaCalculoBanca,
  Banca,
} from "@/types/banca";

type FormularioBanca = {
  nome: string;
  valor_inicial: string;
  meta_mensal: string;
  limite_por_aposta: string;
};

const FORMULARIO_INICIAL: FormularioBanca = {
  nome: "Banca principal",
  valor_inicial: "",
  meta_mensal: "",
  limite_por_aposta: "5",
};

function converterNumero(
  valor: string
) {
  const texto = valor
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

  const numero = Number(texto);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function formatarCampoNumero(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(valor);
}

function obterClasseLucro(
  valor: number
) {
  if (valor > 0) {
    return "text-emerald-400";
  }

  if (valor < 0) {
    return "text-red-400";
  }

  return "text-zinc-300";
}

function obterClasseProgresso(
  percentual: number
) {
  if (percentual >= 100) {
    return "bg-emerald-500";
  }

  if (percentual >= 60) {
    return "bg-blue-500";
  }

  if (percentual > 0) {
    return "bg-amber-500";
  }

  return "bg-zinc-700";
}

function CardResumo({
  titulo,
  valor,
  descricao,
  icone,
  destaque = "neutro",
}: {
  titulo: string;
  valor: string;
  descricao: string;
  icone: string;
  destaque?:
    | "neutro"
    | "positivo"
    | "negativo"
    | "atencao";
}) {
  const classes = {
    neutro:
      "border-zinc-800 bg-zinc-950 text-white",

    positivo:
      "border-emerald-900/60 bg-emerald-950/20 text-emerald-400",

    negativo:
      "border-red-900/60 bg-red-950/20 text-red-400",

    atencao:
      "border-amber-900/60 bg-amber-950/20 text-amber-400",
  };

  return (
    <article
      className={`rounded-2xl border p-5 ${classes[destaque]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            {titulo}
          </p>

          <p className="mt-3 break-words text-2xl font-bold">
            {valor}
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            {descricao}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-800 bg-black text-lg">
          {icone}
        </div>
      </div>
    </article>
  );
}

function EstadoCarregando() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 8,
        }).map((_, indice) => (
          <div
            key={indice}
            className="h-36 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950"
          />
        ))}
      </div>

      <div className="h-72 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950" />
    </div>
  );
}

export default function PaginaBanca() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [banca, setBanca] =
    useState<Banca | null>(null);

  const [apostas, setApostas] =
    useState<
      ApostaParaCalculoBanca[]
    >([]);

  const [formulario, setFormulario] =
    useState<FormularioBanca>(
      FORMULARIO_INICIAL
    );

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    modoEdicao,
    setModoEdicao,
  ] = useState(false);

  const [
    confirmandoExclusao,
    setConfirmandoExclusao,
  ] = useState(false);

  const [
    excluindo,
    setExcluindo,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const carregarDados =
    useCallback(
      async (
        mostrarCarregamento = true
      ) => {
        if (mostrarCarregamento) {
          setCarregando(true);
        }

        setErro("");

        try {
          const {
            data: usuarioData,
            error: usuarioError,
          } =
            await supabase.auth.getUser();

          if (usuarioError) {
            throw usuarioError;
          }

          const usuario =
            usuarioData.user;

          if (!usuario) {
            throw new Error(
              "Sua sessão expirou. Entre novamente."
            );
          }

          const [
            respostaBanca,
            respostaApostas,
          ] = await Promise.all([
            supabase
              .from("bancas")
              .select(
                `
                  id,
                  user_id,
                  nome,
                  valor_inicial,
                  meta_mensal,
                  limite_por_aposta,
                  ativa,
                  iniciada_em,
                  created_at,
                  updated_at
                `
              )
              .eq(
                "user_id",
                usuario.id
              )
              .eq(
                "ativa",
                true
              )
              .maybeSingle(),

            supabase
              .from("apostas")
              .select(
                `
                  id,
                  valor_apostado,
                  retorno_potencial,
                  lucro_prejuizo,
                  resultado,
                  data_aposta,
                  created_at
                `
              )
              .eq(
                "user_id",
                usuario.id
              )
              .order(
                "data_aposta",
                {
                  ascending: false,
                }
              ),
          ]);

          if (respostaBanca.error) {
            throw respostaBanca.error;
          }

          if (respostaApostas.error) {
            throw respostaApostas.error;
          }

          const registroBanca =
            respostaBanca.data;

          if (registroBanca) {
            const bancaConvertida:
              Banca = {
              id:
                Number(
                  registroBanca.id
                ),

              user_id:
                String(
                  registroBanca.user_id
                ),

              nome:
                String(
                  registroBanca.nome
                ),

              valor_inicial:
                Number(
                  registroBanca
                    .valor_inicial
                ),

              meta_mensal:
                Number(
                  registroBanca
                    .meta_mensal
                ),

              limite_por_aposta:
                Number(
                  registroBanca
                    .limite_por_aposta
                ),

              ativa:
                Boolean(
                  registroBanca.ativa
                ),

              iniciada_em:
                String(
                  registroBanca
                    .iniciada_em
                ),

              created_at:
                String(
                  registroBanca
                    .created_at
                ),

              updated_at:
                String(
                  registroBanca
                    .updated_at
                ),
            };

            setBanca(
              bancaConvertida
            );

            setFormulario({
              nome:
                bancaConvertida.nome,

              valor_inicial:
                formatarCampoNumero(
                  bancaConvertida
                    .valor_inicial
                ),

              meta_mensal:
                formatarCampoNumero(
                  bancaConvertida
                    .meta_mensal
                ),

              limite_por_aposta:
                formatarCampoNumero(
                  bancaConvertida
                    .limite_por_aposta
                ),
            });
          } else {
            setBanca(null);
            setModoEdicao(true);

            setFormulario(
              FORMULARIO_INICIAL
            );
          }

          const apostasConvertidas:
            ApostaParaCalculoBanca[] =
            (
              respostaApostas.data ??
              []
            ).map(
              (aposta) => ({
                id:
                  Number(
                    aposta.id
                  ),

                valor_apostado:
                  Number(
                    aposta
                      .valor_apostado
                  ),

                retorno_potencial:
                  Number(
                    aposta
                      .retorno_potencial
                  ),

                lucro_prejuizo:
                  Number(
                    aposta
                      .lucro_prejuizo
                  ),

                resultado:
                  aposta.resultado as
                    ApostaParaCalculoBanca["resultado"],

                data_aposta:
                  String(
                    aposta.data_aposta
                  ),

                created_at:
                  aposta.created_at
                    ? String(
                        aposta.created_at
                      )
                    : null,
              })
            );

          setApostas(
            apostasConvertidas
          );
        } catch (error) {
          console.error(
            "Erro ao carregar banca:",
            error
          );

          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados da banca."
          );

          setBanca(null);
          setApostas([]);
        } finally {
          setCarregando(false);
        }
      },
      [supabase]
    );

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    function atualizarAoVoltar() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        void carregarDados(false);
      }
    }

    window.addEventListener(
      "focus",
      atualizarAoVoltar
    );

    document.addEventListener(
      "visibilitychange",
      atualizarAoVoltar
    );

    return () => {
      window.removeEventListener(
        "focus",
        atualizarAoVoltar
      );

      document.removeEventListener(
        "visibilitychange",
        atualizarAoVoltar
      );
    };
  }, [carregarDados]);

  const resumo = useMemo(
    () =>
      calcularResumoBanca(
        banca,
        apostas
      ),
    [
      banca,
      apostas,
    ]
  );

  const progressoMetaVisual =
    Math.min(
      Math.max(
        resumo.progressoMeta,
        0
      ),
      100
    );

  function atualizarCampo(
    campo:
      keyof FormularioBanca,

    valor: string
  ) {
    setFormulario(
      (estadoAtual) => ({
        ...estadoAtual,
        [campo]: valor,
      })
    );
  }

  function iniciarEdicao() {
    setErro("");
    setSucesso("");
    setModoEdicao(true);
  }

  function cancelarEdicao() {
    setErro("");
    setSucesso("");

    if (!banca) {
      setFormulario(
        FORMULARIO_INICIAL
      );

      return;
    }

    setFormulario({
      nome:
        banca.nome,

      valor_inicial:
        formatarCampoNumero(
          banca.valor_inicial
        ),

      meta_mensal:
        formatarCampoNumero(
          banca.meta_mensal
        ),

      limite_por_aposta:
        formatarCampoNumero(
          banca.limite_por_aposta
        ),
    });

    setModoEdicao(false);
  }

  async function salvarBanca(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setSucesso("");

    const nome =
      formulario.nome.trim();

    const valorInicial =
      converterNumero(
        formulario.valor_inicial
      );

    const metaMensal =
      converterNumero(
        formulario.meta_mensal
      );

    const limitePorAposta =
      converterNumero(
        formulario
          .limite_por_aposta
      );

    if (!nome) {
      setErro(
        "Informe o nome da banca."
      );

      return;
    }

    if (valorInicial < 0) {
      setErro(
        "O valor inicial não pode ser negativo."
      );

      return;
    }

    if (metaMensal < 0) {
      setErro(
        "A meta mensal não pode ser negativa."
      );

      return;
    }

    if (
      limitePorAposta <= 0 ||
      limitePorAposta > 100
    ) {
      setErro(
        "O limite por aposta deve ser maior que zero e menor ou igual a 100%."
      );

      return;
    }

    setSalvando(true);

    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } =
        await supabase.auth.getUser();

      if (usuarioError) {
        throw usuarioError;
      }

      const usuario =
        usuarioData.user;

      if (!usuario) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      const dadosBanca = {
        user_id:
          usuario.id,

        nome,

        valor_inicial:
          valorInicial,

        meta_mensal:
          metaMensal,

        limite_por_aposta:
          limitePorAposta,

        ativa: true,

        iniciada_em:
          banca?.iniciada_em ??
          new Date().toISOString(),
      };

      if (banca) {
        const {
          error:
            erroAtualizacao,
        } = await supabase
          .from("bancas")
          .update({
            nome:
              dadosBanca.nome,

            valor_inicial:
              dadosBanca
                .valor_inicial,

            meta_mensal:
              dadosBanca
                .meta_mensal,

            limite_por_aposta:
              dadosBanca
                .limite_por_aposta,
          })
          .eq(
            "id",
            banca.id
          )
          .eq(
            "user_id",
            usuario.id
          );

        if (erroAtualizacao) {
          throw erroAtualizacao;
        }

        setSucesso(
          "Banca atualizada com sucesso."
        );
      } else {
        const {
          error:
            erroInsercao,
        } = await supabase
          .from("bancas")
          .insert(
            dadosBanca
          );

        if (erroInsercao) {
          throw erroInsercao;
        }

        setSucesso(
          "Banca criada com sucesso."
        );
      }

      setModoEdicao(false);

      await carregarDados(false);
    } catch (error) {
      console.error(
        "Erro ao salvar banca:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a banca."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirBanca() {
    if (!banca) {
      return;
    }

    setExcluindo(true);
    setErro("");
    setSucesso("");

    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError) {
        throw usuarioError;
      }

      const usuario = usuarioData.user;

      if (!usuario) {
        throw new Error(
          "Sua sessão expirou. Entre novamente."
        );
      }

      const { error: erroExclusao } =
        await supabase
          .from("bancas")
          .delete()
          .eq("id", banca.id)
          .eq("user_id", usuario.id);

      if (erroExclusao) {
        throw erroExclusao;
      }

      setBanca(null);
      setApostas([]);
      setFormulario({
        ...FORMULARIO_INICIAL,
      });
      setModoEdicao(true);
      setConfirmandoExclusao(false);
      setSucesso(
        "Banca excluída. O histórico de apostas foi preservado e uma nova banca começará do zero."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir banca:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a banca."
      );
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Gestão de banca
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
              Controle seu saldo, acompanhe
              riscos e defina limites seguros
              para suas apostas.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/apostas"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white"
            >
              Ver apostas
            </Link>

            {banca && !modoEdicao && (
              <>
                <button
                  type="button"
                  onClick={iniciarEdicao}
                  disabled={excluindo}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Editar banca
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmandoExclusao(true)
                  }
                  disabled={excluindo}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-red-900/70 bg-red-950/30 px-5 py-3 text-sm font-semibold text-red-400 transition hover:border-red-700 hover:bg-red-950/50 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Excluir banca
                </button>
              </>
            )}
          </div>
        </header>

        {erro && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-red-900/70 bg-red-950/40 px-5 py-4 text-sm text-red-300"
          >
            <p>{erro}</p>

            <button
              type="button"
              onClick={() =>
                setErro("")
              }
              aria-label="Fechar mensagem"
              className="shrink-0 text-red-400 transition hover:text-red-200"
            >
              ✕
            </button>
          </div>
        )}

        {sucesso && (
          <div
            role="status"
            className="mt-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-900/70 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300"
          >
            <p>{sucesso}</p>

            <button
              type="button"
              onClick={() =>
                setSucesso("")
              }
              aria-label="Fechar mensagem"
              className="shrink-0 text-emerald-400 transition hover:text-emerald-200"
            >
              ✕
            </button>
          </div>
        )}

        {confirmandoExclusao && banca && (
          <section className="mt-6 rounded-2xl border border-red-900/70 bg-red-950/30 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-400">
              Atenção
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Excluir a banca “{banca.nome}”?
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-red-200/70">
              A configuração e os cálculos desta banca serão zerados. As apostas registradas continuarão no histórico. Ao criar uma nova banca, somente apostas feitas após o novo início entrarão nos cálculos.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setConfirmandoExclusao(false)
                }
                disabled={excluindo}
                className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() =>
                  void excluirBanca()
                }
                disabled={excluindo}
                className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindo
                  ? "Excluindo..."
                  : "Confirmar exclusão"}
              </button>
            </div>
          </section>
        )}

        {carregando ? (
          <div className="mt-8">
            <EstadoCarregando />
          </div>
        ) : (
          <>
            {!banca &&
              !modoEdicao && (
                <div className="mt-8 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 px-6 py-16 text-center">
                  <h2 className="text-xl font-bold">
                    Nenhuma banca cadastrada
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Cadastre sua banca
                    principal para começar o
                    acompanhamento.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setModoEdicao(true)
                    }
                    className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Criar banca
                  </button>
                </div>
              )}

            {modoEdicao && (
              <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
                <div>
                  <h2 className="text-xl font-bold">
                    {banca
                      ? "Editar banca"
                      : "Criar banca"}
                  </h2>

                  <p className="mt-2 text-sm text-zinc-500">
                    Configure o saldo inicial,
                    a meta e o limite de risco
                    permitido por entrada.
                  </p>
                </div>

                <form
                  onSubmit={
                    salvarBanca
                  }
                  className="mt-6"
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="nome-banca"
                        className="mb-2 block text-sm font-medium text-zinc-400"
                      >
                        Nome da banca
                      </label>

                      <input
                        id="nome-banca"
                        type="text"
                        value={
                          formulario.nome
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarCampo(
                            "nome",
                            event.target
                              .value
                          )
                        }
                        placeholder="Banca principal"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="valor-inicial"
                        className="mb-2 block text-sm font-medium text-zinc-400"
                      >
                        Valor inicial
                      </label>

                      <input
                        id="valor-inicial"
                        type="text"
                        inputMode="decimal"
                        value={
                          formulario
                            .valor_inicial
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarCampo(
                            "valor_inicial",
                            event.target
                              .value
                          )
                        }
                        placeholder="1.000,00"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="meta-mensal"
                        className="mb-2 block text-sm font-medium text-zinc-400"
                      >
                        Meta mensal de lucro
                      </label>

                      <input
                        id="meta-mensal"
                        type="text"
                        inputMode="decimal"
                        value={
                          formulario
                            .meta_mensal
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarCampo(
                            "meta_mensal",
                            event.target
                              .value
                          )
                        }
                        placeholder="200,00"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label
                        htmlFor="limite-aposta"
                        className="mb-2 block text-sm font-medium text-zinc-400"
                      >
                        Limite da banca por
                        aposta (%)
                      </label>

                      <input
                        id="limite-aposta"
                        type="text"
                        inputMode="decimal"
                        value={
                          formulario
                            .limite_por_aposta
                        }
                        onChange={(
                          event
                        ) =>
                          atualizarCampo(
                            "limite_por_aposta",
                            event.target
                              .value
                          )
                        }
                        placeholder="5,00"
                        className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
                      />

                      <p className="mt-2 text-xs leading-5 text-zinc-600">
                        Exemplo: com limite de
                        5%, uma banca de R$
                        1.000,00 recomenda no
                        máximo R$ 50,00 por
                        aposta.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {banca && (
                      <button
                        type="button"
                        onClick={
                          cancelarEdicao
                        }
                        disabled={
                          salvando
                        }
                        className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={
                        salvando
                      }
                      className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {salvando
                        ? "Salvando..."
                        : banca
                          ? "Salvar alterações"
                          : "Criar banca"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {banca &&
              !modoEdicao && (
                <>
                  <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <CardResumo
                      titulo="Banca inicial"
                      valor={
                        formatarMoedaBanca(
                          resumo.valorInicial
                        )
                      }
                      descricao={
                        banca.nome
                      }
                      icone="R$"
                    />

                    <CardResumo
                      titulo="Saldo atual"
                      valor={
                        formatarMoedaBanca(
                          resumo.saldoAtual
                        )
                      }
                      descricao="Inicial + resultados finalizados"
                      icone="◎"
                      destaque={
                        resumo.saldoAtual >=
                        resumo.valorInicial
                          ? "positivo"
                          : "negativo"
                      }
                    />

                    <CardResumo
                      titulo="Saldo disponível"
                      valor={
                        formatarMoedaBanca(
                          resumo.saldoDisponivel
                        )
                      }
                      descricao="Saldo atual menos apostas pendentes"
                      icone="◉"
                      destaque={
                        resumo.saldoDisponivel > 0
                          ? "positivo"
                          : resumo.saldoDisponivel < 0
                            ? "negativo"
                            : "neutro"
                      }
                    />

                    <CardResumo
                      titulo="Em apostas pendentes"
                      valor={
                        formatarMoedaBanca(
                          resumo.valorPendente
                        )
                      }
                      descricao={`${resumo.quantidadePendentes} aposta(s) aguardando`}
                      icone="⌛"
                      destaque={
                        resumo.valorPendente >
                        0
                          ? "atencao"
                          : "neutro"
                      }
                    />

                    <CardResumo
                      titulo="Lucro / prejuízo"
                      valor={
                        formatarMoedaBanca(
                          resumo.lucroPrejuizo
                        )
                      }
                      descricao="Resultado acumulado"
                      icone="↕"
                      destaque={
                        resumo.lucroPrejuizo >
                        0
                          ? "positivo"
                          : resumo.lucroPrejuizo <
                              0
                            ? "negativo"
                            : "neutro"
                      }
                    />

                    <CardResumo
                      titulo="ROI da banca"
                      valor={
                        formatarPercentualBanca(
                          resumo.roi
                        )
                      }
                      descricao="Lucro sobre a banca inicial"
                      icone="%"
                      destaque={
                        resumo.roi >= 0
                          ? "positivo"
                          : "negativo"
                      }
                    />

                    <CardResumo
                      titulo="Taxa de acerto"
                      valor={
                        formatarPercentualBanca(
                          resumo.taxaAcerto
                        )
                      }
                      descricao={`${resumo.quantidadeGanhas} ganha(s) e ${resumo.quantidadePerdidas} perdida(s)`}
                      icone="✓"
                      destaque={
                        resumo.taxaAcerto >=
                        60
                          ? "positivo"
                          : resumo.taxaAcerto >
                              0
                            ? "atencao"
                            : "neutro"
                      }
                    />

                    <CardResumo
                      titulo="Limite por entrada"
                      valor={
                        formatarPercentualBanca(
                          resumo.limitePorAposta
                        )
                      }
                      descricao="Percentual máximo definido"
                      icone="!"
                      destaque="atencao"
                    />

                    <CardResumo
                      titulo="Valor recomendado"
                      valor={
                        formatarMoedaBanca(
                          resumo
                            .valorMaximoRecomendado
                        )
                      }
                      descricao="Máximo sugerido por aposta"
                      icone="◈"
                      destaque="positivo"
                    />
                  </section>

                  <section className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600">
                            Meta mensal
                          </p>

                          <h2 className="mt-2 text-xl font-bold">
                            Progresso da meta
                          </h2>
                        </div>

                        <span
                          className={`text-lg font-bold ${obterClasseLucro(
                            resumo
                              .lucroPrejuizo
                          )}`}
                        >
                          {formatarPercentualBanca(
                            resumo
                              .progressoMeta
                          )}
                        </span>
                      </div>

                      <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between gap-4 text-sm">
                          <span className="text-zinc-500">
                            Resultado atual
                          </span>

                          <strong
                            className={obterClasseLucro(
                              resumo
                                .lucroPrejuizo
                            )}
                          >
                            {formatarMoedaBanca(
                              resumo
                                .lucroPrejuizo
                            )}
                          </strong>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-black">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${obterClasseProgresso(
                              resumo
                                .progressoMeta
                            )}`}
                            style={{
                              width:
                                `${progressoMetaVisual}%`,
                            }}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4 text-xs text-zinc-600">
                          <span>
                            R$ 0,00
                          </span>

                          <span>
                            Meta:{" "}
                            {formatarMoedaBanca(
                              resumo
                                .metaMensal
                            )}
                          </span>
                        </div>
                      </div>

                      {resumo.metaMensal ===
                        0 && (
                        <div className="mt-5 rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3 text-sm text-amber-300/80">
                          Defina uma meta mensal
                          para acompanhar o
                          progresso financeiro.
                        </div>
                      )}

                      {resumo.progressoMeta >=
                        100 && (
                        <div className="mt-5 rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-300">
                          Meta mensal alcançada.
                        </div>
                      )}
                    </article>

                    <article className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
                      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600">
                        Desempenho
                      </p>

                      <h2 className="mt-2 text-xl font-bold">
                        Resumo das apostas
                      </h2>

                      <div className="mt-6 space-y-4">
                        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                          <span className="text-sm text-zinc-500">
                            Total de apostas
                          </span>

                          <strong>
                            {
                              resumo
                                .quantidadeApostas
                            }
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                          <span className="text-sm text-zinc-500">
                            Ganhas
                          </span>

                          <strong className="text-emerald-400">
                            {
                              resumo
                                .quantidadeGanhas
                            }
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                          <span className="text-sm text-zinc-500">
                            Perdidas
                          </span>

                          <strong className="text-red-400">
                            {
                              resumo
                                .quantidadePerdidas
                            }
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                          <span className="text-sm text-zinc-500">
                            Anuladas
                          </span>

                          <strong className="text-zinc-300">
                            {
                              resumo
                                .quantidadeAnuladas
                            }
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
                          <span className="text-sm text-zinc-500">
                            Maior lucro
                          </span>

                          <strong className="text-emerald-400">
                            {formatarMoedaBanca(
                              resumo
                                .maiorLucro
                            )}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm text-zinc-500">
                            Maior prejuízo
                          </span>

                          <strong className="text-red-400">
                            {formatarMoedaBanca(
                              resumo
                                .maiorPrejuizo
                            )}
                          </strong>
                        </div>
                      </div>
                    </article>
                  </section>

                  <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-zinc-600">
                      Ciclo atual
                    </p>

                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {banca.nome}
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                          Iniciada em {formatarDataInicioBanca(
                            banca.iniciada_em
                          )}
                        </p>
                      </div>

                      <p className="max-w-xl text-sm leading-6 text-zinc-500 sm:text-right">
                        Apenas apostas registradas a partir deste início entram nos cálculos da banca atual.
                      </p>
                    </div>
                  </section>

                  <section className="mt-8 rounded-2xl border border-blue-900/50 bg-blue-950/20 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-400">
                          Gestão de risco
                        </p>

                        <h2 className="mt-2 text-xl font-bold">
                          Limite recomendado por
                          aposta
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                          Com o saldo disponível de{" "}
                          <strong className="text-white">
                            {formatarMoedaBanca(
                              resumo
                                .saldoDisponivel
                            )}
                          </strong>{" "}
                          e limite de{" "}
                          <strong className="text-white">
                            {formatarPercentualBanca(
                              resumo
                                .limitePorAposta
                            )}
                          </strong>
                          , o valor máximo sugerido
                          por entrada é:
                        </p>
                      </div>

                      <div className="shrink-0 rounded-2xl border border-blue-800/70 bg-black px-6 py-5 text-center">
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                          Valor máximo
                        </p>

                        <p className="mt-2 text-3xl font-bold text-blue-400">
                          {formatarMoedaBanca(
                            resumo
                              .valorMaximoRecomendado
                          )}
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
          </>
        )}
      </div>
    </main>
  );
}