"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import CampoData from "@/components/campo-data";
import { createClient } from "@/lib/supabase/client";

import {
  COMPETICOES_APOSTAS,
  FORMULARIO_APOSTA_INICIAL,
  MODALIDADES_APOSTAS,
  calcularLucroPrejuizo,
  calcularRetornoPotencial,
  converterFormularioParaAposta,
  converterOdd,
  converterValorMonetario,
  criarFormularioDaDica,
} from "@/types/aposta";

import {
  analisarRiscoAposta,
  calcularResumoBanca,
  formatarMoedaBanca,
  formatarPercentualBanca,
} from "@/types/banca";

import type {
  Aposta,
  DicaParaAposta,
  FormularioAposta as DadosFormularioAposta,
  ResultadoAposta,
} from "@/types/aposta";

import type {
  AnaliseRiscoAposta,
  ApostaParaCalculoBanca,
  Banca,
} from "@/types/banca";

type FormularioApostaProps = {
  aposta?: Aposta | null;
  dicaOrigem?: DicaParaAposta | null;
  carregandoExterno?: boolean;
  onConcluido?: () => Promise<void> | void;
  onCancelar?: () => void;
};

const OPCOES_RESULTADO: {
  valor: ResultadoAposta;
  texto: string;
}[] = [
  {
    valor: "pendente",
    texto: "Pendente",
  },
  {
    valor: "ganha",
    texto: "Ganha",
  },
  {
    valor: "perdida",
    texto: "Perdida",
  },
  {
    valor: "anulada",
    texto: "Anulada",
  },
];

function formatarMoeda(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number.isFinite(valor)
      ? valor
      : 0
  );
}

function formatarOdd(
  valor: number
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(
    Number.isFinite(valor)
      ? valor
      : 0
  );
}

function converterApostaParaFormulario(
  aposta: Aposta
): DadosFormularioAposta {
  return {
    descricao:
      aposta.descricao,

    modalidade:
      aposta.modalidade,

    competicao:
      aposta.competicao ??
      "",

    timeCasa:
      aposta.time_casa ??
      "",

    timeVisitante:
      aposta.time_visitante ??
      "",

    casaAposta:
      aposta.casa_aposta ??
      "",

    valorApostado:
      Number(
        aposta.valor_apostado
      )
        .toFixed(2)
        .replace(".", ","),

    odd:
      Number(aposta.odd)
        .toFixed(2)
        .replace(".", ","),

    resultado:
      aposta.resultado,

    dataAposta:
      aposta.data_aposta,

    observacao:
      aposta.observacao ??
      "",
  };
}

function obterTextoNivelRisco(
  nivel:
    AnaliseRiscoAposta["nivel"]
) {
  if (nivel === "baixo") {
    return "Risco baixo";
  }

  if (nivel === "moderado") {
    return "Risco moderado";
  }

  if (nivel === "alto") {
    return "Risco alto";
  }

  return "Risco crítico";
}

function obterClassesRisco(
  nivel:
    AnaliseRiscoAposta["nivel"]
) {
  if (nivel === "baixo") {
    return {
      painel:
        "border-emerald-900/60 bg-emerald-950/20",

      titulo:
        "text-emerald-400",

      selo:
        "border-emerald-800 bg-emerald-950/60 text-emerald-300",

      barra:
        "bg-emerald-500",

      valor:
        "text-emerald-400",
    };
  }

  if (nivel === "moderado") {
    return {
      painel:
        "border-amber-900/60 bg-amber-950/20",

      titulo:
        "text-amber-400",

      selo:
        "border-amber-800 bg-amber-950/60 text-amber-300",

      barra:
        "bg-amber-500",

      valor:
        "text-amber-400",
    };
  }

  if (nivel === "alto") {
    return {
      painel:
        "border-orange-900/60 bg-orange-950/20",

      titulo:
        "text-orange-400",

      selo:
        "border-orange-800 bg-orange-950/60 text-orange-300",

      barra:
        "bg-orange-500",

      valor:
        "text-orange-400",
    };
  }

  return {
    painel:
      "border-red-900/70 bg-red-950/30",

    titulo:
      "text-red-400",

    selo:
      "border-red-800 bg-red-950/60 text-red-300",

    barra:
      "bg-red-500",

    valor:
      "text-red-400",
  };
}

export default function FormularioAposta({
  aposta = null,
  dicaOrigem = null,
  carregandoExterno = false,
  onConcluido,
  onCancelar,
}: FormularioApostaProps) {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [
    formulario,
    setFormulario,
  ] =
    useState<DadosFormularioAposta>({
      ...FORMULARIO_APOSTA_INICIAL,
    });

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  const [
    carregandoBanca,
    setCarregandoBanca,
  ] = useState(true);

  const [
    banca,
    setBanca,
  ] =
    useState<Banca | null>(
      null
    );

  const [
    apostasBanca,
    setApostasBanca,
  ] = useState<
    ApostaParaCalculoBanca[]
  >([]);

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const modoEdicao =
    Boolean(aposta);

  const vindoDeDica =
    Boolean(
      !aposta &&
      dicaOrigem
    );

  const bloqueado =
    carregando ||
    carregandoExterno;

  const valorApostado =
    useMemo(
      () =>
        converterValorMonetario(
          formulario.valorApostado
        ),
      [
        formulario
          .valorApostado,
      ]
    );

  const odd =
    useMemo(
      () =>
        converterOdd(
          formulario.odd
        ),
      [formulario.odd]
    );

  const retornoPotencial =
    useMemo(
      () =>
        calcularRetornoPotencial(
          valorApostado,
          odd
        ),
      [
        valorApostado,
        odd,
      ]
    );

  const lucroPrejuizo =
    useMemo(
      () =>
        calcularLucroPrejuizo(
          valorApostado,
          retornoPotencial,
          formulario.resultado
        ),
      [
        valorApostado,
        retornoPotencial,
        formulario.resultado,
      ]
    );

  const apostasSemEdicao =
    useMemo(
      () =>
        apostasBanca.filter(
          (item) =>
            !aposta ||
            item.id !==
              aposta.id
        ),
      [
        apostasBanca,
        aposta,
      ]
    );

  const resumoBanca =
    useMemo(
      () =>
        calcularResumoBanca(
          banca,
          apostasSemEdicao
        ),
      [
        banca,
        apostasSemEdicao,
      ]
    );

  const analiseRisco =
    useMemo(
      () =>
        analisarRiscoAposta(
          valorApostado,
          resumoBanca
            .saldoDisponivel,
          resumoBanca
            .limitePorAposta
        ),
      [
        valorApostado,
        resumoBanca
          .saldoDisponivel,
        resumoBanca
          .limitePorAposta,
      ]
    );

  const classesRisco =
    obterClassesRisco(
      analiseRisco.nivel
    );

  const percentualBarra =
    analiseRisco
      .limitePermitido >
    0
      ? Math.min(
          (
            analiseRisco
              .percentualDaBanca /
            analiseRisco
              .limitePermitido
          ) *
            100,
          100
        )
      : 0;

  useEffect(() => {
    if (aposta) {
      setFormulario(
        converterApostaParaFormulario(
          aposta
        )
      );
    } else if (dicaOrigem) {
      setFormulario(
        criarFormularioDaDica(
          dicaOrigem
        )
      );
    } else {
      setFormulario({
        ...FORMULARIO_APOSTA_INICIAL,
      });
    }

    setErro("");
    setSucesso("");
  }, [
    aposta,
    dicaOrigem,
  ]);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarBanca() {
      setCarregandoBanca(true);

      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } =
          await supabase.auth
            .getUser();

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
        ] =
          await Promise.all([
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

        if (
          respostaBanca.error
        ) {
          throw respostaBanca.error;
        }

        if (
          respostaApostas.error
        ) {
          throw respostaApostas.error;
        }

        if (!componenteAtivo) {
          return;
        }

        const registroBanca =
          respostaBanca.data;

        if (registroBanca) {
          setBanca({
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
          });
        } else {
          setBanca(null);
        }

        const registros:
          ApostaParaCalculoBanca[] =
          (
            respostaApostas.data ??
            []
          ).map(
            (item) => ({
              id:
                Number(
                  item.id
                ),

              valor_apostado:
                Number(
                  item
                    .valor_apostado
                ),

              retorno_potencial:
                Number(
                  item
                    .retorno_potencial
                ),

              lucro_prejuizo:
                Number(
                  item
                    .lucro_prejuizo
                ),

              resultado:
                item.resultado as
                  ApostaParaCalculoBanca["resultado"],

              data_aposta:
                String(
                  item
                    .data_aposta
                ),

              created_at:
                item.created_at
                  ? String(
                      item.created_at
                    )
                  : null,
            })
          );

        setApostasBanca(
          registros
        );
      } catch (error) {
        console.error(
          "Erro ao carregar dados da banca no formulário:",
          error
        );

        if (componenteAtivo) {
          setBanca(null);
          setApostasBanca([]);
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoBanca(
            false
          );
        }
      }
    }

    void carregarBanca();

    return () => {
      componenteAtivo = false;
    };
  }, [supabase]);

  function atualizarCampo(
    campo:
      keyof DadosFormularioAposta,
    valor: string
  ) {
    setFormulario(
      (estadoAtual) => ({
        ...estadoAtual,
        [campo]: valor,
      })
    );

    setErro("");
    setSucesso("");
  }

  function atualizarResultado(
    resultado:
      ResultadoAposta
  ) {
    setFormulario(
      (estadoAtual) => ({
        ...estadoAtual,
        resultado,
      })
    );

    setErro("");
    setSucesso("");
  }

  function validarFormulario() {
    if (
      !formulario
        .descricao
        .trim()
    ) {
      return "Informe a descrição da aposta.";
    }

    if (
      !formulario.modalidade
    ) {
      return "Selecione a modalidade.";
    }

    if (
      !formulario
        .competicao
        .trim()
    ) {
      return "Informe ou selecione a competição.";
    }

    if (
      !formulario
        .timeCasa
        .trim()
    ) {
      return "Informe o time da casa.";
    }

    if (
      !formulario
        .timeVisitante
        .trim()
    ) {
      return "Informe o time visitante.";
    }

    if (
      formulario.timeCasa
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        ) ===
      formulario.timeVisitante
        .trim()
        .toLocaleLowerCase(
          "pt-BR"
        )
    ) {
      return "Os times do confronto devem ser diferentes.";
    }

    if (
      !Number.isFinite(
        valorApostado
      ) ||
      valorApostado <= 0
    ) {
      return "Informe um valor apostado válido.";
    }

    if (
      !Number.isFinite(odd) ||
      odd < 1
    ) {
      return "Informe uma odd igual ou superior a 1,00.";
    }

    if (
      !formulario.dataAposta
    ) {
      return "Informe a data da aposta.";
    }

    if (
      banca &&
      valorApostado >
        resumoBanca
          .saldoDisponivel
    ) {
      return "O valor apostado não pode ser maior que o saldo disponível da banca.";
    }

    return "";
  }

  async function salvarAposta(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const mensagemValidacao =
      validarFormulario();

    if (mensagemValidacao) {
      setErro(
        mensagemValidacao
      );

      return;
    }

    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } =
        await supabase.auth
          .getUser();

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

      const dadosAposta =
        converterFormularioParaAposta(
          formulario,
          {
            dicaId:
              aposta?.dica_id ??
              dicaOrigem?.id ??
              null,

            fixtureId:
              aposta?.fixture_id ??
              dicaOrigem
                ?.fixture_id ??
              null,

            origem:
              aposta?.origem ??
              (
                dicaOrigem
                  ? "dica"
                  : "manual"
              ),
          }
        );

      if (aposta) {
        const {
          error:
            erroAtualizacao,
        } = await supabase
          .from("apostas")
          .update({
            ...dadosAposta,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            aposta.id
          )
          .eq(
            "user_id",
            usuario.id
          );

        if (erroAtualizacao) {
          throw erroAtualizacao;
        }

        setSucesso(
          "Aposta atualizada com sucesso."
        );
      } else {
        const {
          error:
            erroInsercao,
        } = await supabase
          .from("apostas")
          .insert({
            user_id:
              usuario.id,

            ...dadosAposta,
          });

        if (erroInsercao) {
          if (
            erroInsercao.code ===
            "23505"
          ) {
            throw new Error(
              "Esta dica já foi usada como aposta."
            );
          }

          throw erroInsercao;
        }

        setSucesso(
          dicaOrigem
            ? "Dica adicionada às suas apostas."
            : "Aposta cadastrada com sucesso."
        );
      }

      await onConcluido?.();
    } catch (error) {
      console.error(
        "Erro ao salvar aposta:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a aposta."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form
      onSubmit={salvarAposta}
      className="space-y-5"
    >
      <div>
        <h2 className="text-xl font-bold text-white">
          {modoEdicao
            ? "Editar aposta"
            : vindoDeDica
              ? "Usar dica como aposta"
              : "Nova aposta"}
        </h2>

        <p className="mt-1 text-sm leading-6 text-zinc-500">
          {modoEdicao
            ? "Atualize os dados e o resultado da aposta."
            : vindoDeDica
              ? "Confira a entrada e informe o valor realmente apostado."
              : "Registre o confronto e acompanhe seu desempenho."}
        </p>
      </div>

      {vindoDeDica && (
        <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 px-4 py-3 text-sm text-blue-300">
          Esta aposta ficará vinculada à dica #
          {dicaOrigem?.id}.
        </div>
      )}

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          role="status"
          className="rounded-xl border border-emerald-900/70 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300"
        >
          {sucesso}
        </div>
      )}

      <div>
        <label
          htmlFor="descricao-aposta"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Descrição da aposta
        </label>

        <input
          id="descricao-aposta"
          type="text"
          value={
            formulario.descricao
          }
          onChange={(event) =>
            atualizarCampo(
              "descricao",
              event.target.value
            )
          }
          disabled={bloqueado}
          placeholder="Ex.: Vitória do time da casa"
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="modalidade-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Modalidade
          </label>

          <select
            id="modalidade-aposta"
            value={
              formulario.modalidade
            }
            onChange={(event) =>
              atualizarCampo(
                "modalidade",
                event.target.value
              )
            }
            disabled={bloqueado}
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
          >
            <option value="">
              Selecione
            </option>

            {MODALIDADES_APOSTAS.map(
              (modalidade) => (
                <option
                  key={modalidade}
                  value={modalidade}
                >
                  {modalidade}
                </option>
              )
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="competicao-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Competição
          </label>

          <input
            id="competicao-aposta"
            list="competicoes-apostas"
            value={
              formulario.competicao
            }
            onChange={(event) =>
              atualizarCampo(
                "competicao",
                event.target.value
              )
            }
            disabled={bloqueado}
            placeholder="Competição"
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
          />

          <datalist id="competicoes-apostas">
            {COMPETICOES_APOSTAS.map(
              (competicao) => (
                <option
                  key={competicao}
                  value={competicao}
                />
              )
            )}
          </datalist>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="time-casa-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Time da casa
          </label>

          <input
            id="time-casa-aposta"
            type="text"
            value={
              formulario.timeCasa
            }
            onChange={(event) =>
              atualizarCampo(
                "timeCasa",
                event.target.value
              )
            }
            disabled={bloqueado}
            placeholder="Time da casa"
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="time-visitante-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Time visitante
          </label>

          <input
            id="time-visitante-aposta"
            type="text"
            value={
              formulario.timeVisitante
            }
            onChange={(event) =>
              atualizarCampo(
                "timeVisitante",
                event.target.value
              )
            }
            disabled={bloqueado}
            placeholder="Time visitante"
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="casa-aposta"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Casa de aposta
        </label>

        <input
          id="casa-aposta"
          type="text"
          value={
            formulario.casaAposta
          }
          onChange={(event) =>
            atualizarCampo(
              "casaAposta",
              event.target.value
            )
          }
          disabled={bloqueado}
          placeholder="Ex.: Bet365"
          className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="valor-apostado"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Valor apostado
          </label>

          <input
            id="valor-apostado"
            type="text"
            inputMode="decimal"
            value={
              formulario.valorApostado
            }
            onChange={(event) =>
              atualizarCampo(
                "valorApostado",
                event.target.value
              )
            }
            disabled={bloqueado}
            placeholder="0,00"
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="odd-aposta"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Odd
          </label>

          <input
            id="odd-aposta"
            type="text"
            inputMode="decimal"
            value={
              formulario.odd
            }
            onChange={(event) =>
              atualizarCampo(
                "odd",
                event.target.value
              )
            }
            disabled={bloqueado}
            placeholder="1,80"
            className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
          />
        </div>
      </div>

      {carregandoBanca && (
        <div className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="h-4 w-40 rounded bg-zinc-800" />

          <div className="mt-4 h-24 rounded-xl bg-zinc-900" />
        </div>
      )}

      {!carregandoBanca &&
        !banca && (
          <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5">
            <p className="font-semibold text-amber-400">
              Banca não configurada
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-300/70">
              Cadastre uma banca para receber
              alertas automáticos de risco.
            </p>
          </div>
        )}

      {!carregandoBanca &&
        banca &&
        valorApostado >
          0 && (
          <section
            className={`rounded-2xl border p-5 ${classesRisco.painel}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.16em] ${classesRisco.titulo}`}
                >
                  Gestão de risco
                </p>

                <h3 className="mt-2 text-lg font-bold text-white">
                  Análise da aposta
                </h3>

                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {analiseRisco.mensagem}
                </p>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${classesRisco.selo}`}
              >
                {obterTextoNivelRisco(
                  analiseRisco.nivel
                )}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Saldo disponível
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  {formatarMoedaBanca(
                    resumoBanca
                      .saldoDisponivel
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Percentual usado
                </p>

                <p
                  className={`mt-2 text-lg font-bold ${classesRisco.valor}`}
                >
                  {formatarPercentualBanca(
                    analiseRisco
                      .percentualDaBanca
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Limite permitido
                </p>

                <p className="mt-2 text-lg font-bold text-white">
                  {formatarPercentualBanca(
                    analiseRisco
                      .limitePermitido
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-black/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Valor recomendado
                </p>

                <p className="mt-2 text-lg font-bold text-blue-400">
                  {formatarMoedaBanca(
                    analiseRisco
                      .valorMaximoRecomendado
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between gap-4 text-xs">
                <span className="text-zinc-500">
                  Uso do limite definido
                </span>

                <span
                  className={
                    classesRisco.valor
                  }
                >
                  {formatarPercentualBanca(
                    percentualBarra
                  )}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-black">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${classesRisco.barra}`}
                  style={{
                    width:
                      `${percentualBarra}%`,
                  }}
                />
              </div>
            </div>

            {analiseRisco
              .ultrapassouLimite && (
              <div className="mt-5 rounded-xl border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm leading-6 text-red-300">
                Esta aposta está acima do limite
                definido para a banca. O sistema
                permitirá salvar, mas o risco é
                superior ao recomendado.
              </div>
            )}
          </section>
        )}

      <div>
        <p className="mb-2 block text-sm font-medium text-zinc-300">
          Resultado
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {OPCOES_RESULTADO.map(
            (opcao) => {
              const selecionado =
                formulario.resultado ===
                opcao.valor;

              return (
                <button
                  key={opcao.valor}
                  type="button"
                  onClick={() =>
                    atualizarResultado(
                      opcao.valor
                    )
                  }
                  disabled={
                    bloqueado ||
                    vindoDeDica
                  }
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                    selecionado
                      ? "border-red-600 bg-red-950/40 text-white"
                      : "border-zinc-800 bg-black text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {opcao.texto}
                </button>
              );
            }
          )}
        </div>
      </div>

      <CampoData
        id="data-aposta"
        label="Data da aposta"
        value={
          formulario.dataAposta
        }
        onChange={(valor) =>
          atualizarCampo(
            "dataAposta",
            valor
          )
        }
        required
        descricao="Data em que a aposta foi realizada."
      />

      <div>
        <label
          htmlFor="observacao-aposta"
          className="mb-2 block text-sm font-medium text-zinc-300"
        >
          Observação
        </label>

        <textarea
          id="observacao-aposta"
          rows={4}
          value={
            formulario.observacao
          }
          onChange={(event) =>
            atualizarCampo(
              "observacao",
              event.target.value
            )
          }
          disabled={bloqueado}
          placeholder="Informações adicionais"
          className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:opacity-50"
        />
      </div>

      {valorApostado >
        0 &&
        odd >= 1 && (
          <div className="grid gap-4 rounded-2xl border border-zinc-800 bg-black p-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-500">
                Valor apostado
              </p>

              <p className="mt-2 font-bold text-white">
                {formatarMoeda(
                  valorApostado
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Retorno potencial
              </p>

              <p className="mt-2 font-bold text-blue-400">
                {formatarMoeda(
                  retornoPotencial
                )}
              </p>

              <p className="text-xs text-zinc-600">
                Odd{" "}
                {formatarOdd(odd)}
              </p>
            </div>

            <div>
              <p className="text-sm text-zinc-500">
                Lucro/prejuízo
              </p>

              <p
                className={`mt-2 font-bold ${
                  lucroPrejuizo > 0
                    ? "text-emerald-400"
                    : lucroPrejuizo < 0
                      ? "text-red-400"
                      : "text-zinc-300"
                }`}
              >
                {formatarMoeda(
                  lucroPrejuizo
                )}
              </p>
            </div>
          </div>
        )}

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:justify-end">
        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={bloqueado}
            className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
        )}

        <button
          type="submit"
          disabled={bloqueado}
          className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {bloqueado
            ? "Salvando..."
            : modoEdicao
              ? "Salvar alterações"
              : vindoDeDica
                ? "Confirmar aposta"
                : "Salvar aposta"}
        </button>
      </div>
    </form>
  );
}