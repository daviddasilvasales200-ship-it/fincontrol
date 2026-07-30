"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CardResumoAposta from "@/components/apostas/card-resumo-aposta";
import FormularioAposta from "@/components/apostas/formulario-aposta";
import ListaApostas from "@/components/apostas/lista-apostas";
import ModalAposta from "@/components/apostas/modal-aposta";
import { createClient } from "@/lib/supabase/client";
import { calcularResumoApostas } from "@/types/aposta";

import type {
  Aposta,
  DicaParaAposta,
  FiltroResultadoAposta,
} from "@/types/aposta";

export default function PaginaApostas() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dicaIdParametro = searchParams.get("dica");

  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [apostaSelecionada, setApostaSelecionada] = useState<Aposta | null>(null);
  const [dicaOrigem, setDicaOrigem] = useState<DicaParaAposta | null>(null);
  const [busca, setBusca] = useState("");
  const [competicao, setCompeticao] = useState("todas");
  const [resultado, setResultado] = useState<FiltroResultadoAposta>("todos");
  const [carregando, setCarregando] = useState(true);
  const [carregandoDica, setCarregandoDica] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarApostas = useCallback(
    async (mostrarCarregamento = true) => {
      if (mostrarCarregamento) setCarregando(true);
      setErro("");

      try {
        const {
          data: usuarioData,
          error: usuarioError,
        } = await supabase.auth.getUser();

        if (usuarioError) throw usuarioError;
        const usuario = usuarioData.user;
        if (!usuario) throw new Error("Sua sessão expirou. Entre novamente.");

        const { data, error } = await supabase
          .from("apostas")
          .select(`
            id,
            user_id,
            dica_id,
            fixture_id,
            origem,
            descricao,
            modalidade,
            competicao,
            time_casa,
            time_visitante,
            casa_aposta,
            valor_apostado,
            odd,
            retorno_potencial,
            resultado,
            lucro_prejuizo,
            data_aposta,
            observacao,
            created_at,
            updated_at
          `)
          .eq("user_id", usuario.id)
          .order("data_aposta", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;

        const registros: Aposta[] = (data ?? []).map((aposta) => ({
          id: Number(aposta.id),
          user_id: String(aposta.user_id),
          dica_id:
            aposta.dica_id === null || aposta.dica_id === undefined
              ? null
              : Number(aposta.dica_id),
          fixture_id:
            aposta.fixture_id === null || aposta.fixture_id === undefined
              ? null
              : Number(aposta.fixture_id),
          origem: aposta.origem === "dica" ? "dica" : "manual",
          descricao: String(aposta.descricao),
          modalidade: String(aposta.modalidade),
          competicao: aposta.competicao ? String(aposta.competicao) : null,
          time_casa: aposta.time_casa ? String(aposta.time_casa) : null,
          time_visitante: aposta.time_visitante
            ? String(aposta.time_visitante)
            : null,
          casa_aposta: aposta.casa_aposta ? String(aposta.casa_aposta) : null,
          valor_apostado: Number(aposta.valor_apostado),
          odd: Number(aposta.odd),
          retorno_potencial: Number(aposta.retorno_potencial),
          resultado: aposta.resultado as Aposta["resultado"],
          lucro_prejuizo: Number(aposta.lucro_prejuizo),
          data_aposta: String(aposta.data_aposta),
          observacao: aposta.observacao ? String(aposta.observacao) : null,
          created_at: String(aposta.created_at),
          updated_at: String(aposta.updated_at),
        }));

        setApostas(registros);
      } catch (error) {
        console.error("Erro ao carregar apostas:", error);
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as apostas."
        );
        setApostas([]);
      } finally {
        setCarregando(false);
      }
    },
    [supabase]
  );

  const carregarDicaDaUrl = useCallback(async () => {
    if (!dicaIdParametro) return;

    const dicaId = Number(dicaIdParametro);
    if (!Number.isInteger(dicaId) || dicaId <= 0) {
      setErro("O identificador da dica é inválido.");
      return;
    }

    setCarregandoDica(true);
    setErro("");

    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError) throw usuarioError;
      const usuario = usuarioData.user;
      if (!usuario) throw new Error("Sua sessão expirou. Entre novamente.");

      const { data: apostaExistente, error: erroApostaExistente } =
        await supabase
          .from("apostas")
          .select("id")
          .eq("user_id", usuario.id)
          .eq("dica_id", dicaId)
          .maybeSingle();

      if (erroApostaExistente) throw erroApostaExistente;
      if (apostaExistente) {
        throw new Error("Esta dica já foi usada como aposta.");
      }

      const { data, error } = await supabase
        .from("dicas_apostas")
        .select(`
          id,
          fixture_id,
          esporte,
          competicao,
          time_casa,
          time_visitante,
          data_jogo,
          mercado,
          entrada_sugerida,
          odd,
          resultado
        `)
        .eq("id", dicaId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("A dica selecionada não foi encontrada.");

      const dica: DicaParaAposta = {
        id: Number(data.id),
        fixture_id:
          data.fixture_id === null || data.fixture_id === undefined
            ? null
            : Number(data.fixture_id),
        esporte: String(data.esporte),
        competicao: String(data.competicao),
        time_casa: String(data.time_casa),
        time_visitante: String(data.time_visitante),
        data_jogo: String(data.data_jogo),
        mercado: String(data.mercado),
        entrada_sugerida: String(data.entrada_sugerida),
        odd: Number(data.odd),
        resultado: data.resultado as DicaParaAposta["resultado"],
      };

      setApostaSelecionada(null);
      setDicaOrigem(dica);
      setModalAberto(true);
    } catch (error) {
      console.error("Erro ao carregar dica:", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a dica."
      );
    } finally {
      setCarregandoDica(false);
    }
  }, [dicaIdParametro, supabase]);

  useEffect(() => {
    void carregarApostas();
  }, [carregarApostas]);

  useEffect(() => {
    void carregarDicaDaUrl();
  }, [carregarDicaDaUrl]);

  const competicoesDisponiveis = useMemo(() => {
    const nomes = apostas
      .map((aposta) => aposta.competicao?.trim())
      .filter((item): item is string => Boolean(item));

    return Array.from(new Set(nomes)).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [apostas]);

  const apostasFiltradas = useMemo(() => {
    const buscaNormalizada = busca.trim().toLocaleLowerCase("pt-BR");

    return apostas.filter((aposta) => {
      const correspondeCompeticao =
        competicao === "todas" || aposta.competicao === competicao;
      const correspondeResultado =
        resultado === "todos" || aposta.resultado === resultado;

      if (!correspondeCompeticao || !correspondeResultado) return false;
      if (!buscaNormalizada) return true;

      return [
        aposta.descricao,
        aposta.modalidade,
        aposta.competicao ?? "",
        aposta.time_casa ?? "",
        aposta.time_visitante ?? "",
        aposta.casa_aposta ?? "",
        aposta.observacao ?? "",
        aposta.origem,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(buscaNormalizada);
    });
  }, [apostas, busca, competicao, resultado]);

  const resumo = useMemo(() => calcularResumoApostas(apostas), [apostas]);

  function abrirNovoCadastro() {
    setDicaOrigem(null);
    setApostaSelecionada(null);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(aposta: Aposta) {
    setDicaOrigem(null);
    setApostaSelecionada(aposta);
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setApostaSelecionada(null);
    setDicaOrigem(null);
    if (dicaIdParametro) router.replace("/apostas");
  }

  async function concluirSalvamento() {
    const editando = Boolean(apostaSelecionada);
    const veioDeDica = Boolean(dicaOrigem);

    fecharModal();
    setSucesso(
      editando
        ? "Aposta atualizada com sucesso."
        : veioDeDica
          ? "Dica adicionada às apostas com sucesso."
          : "Aposta cadastrada com sucesso."
    );
    await carregarApostas(false);
  }

  async function excluirAposta(aposta: Aposta) {
    if (!window.confirm(`Deseja excluir a aposta "${aposta.descricao}"?`)) {
      return;
    }

    setProcessandoId(aposta.id);
    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (usuarioError) throw usuarioError;
      const usuario = usuarioData.user;
      if (!usuario) throw new Error("Sua sessão expirou. Entre novamente.");

      const { error } = await supabase
        .from("apostas")
        .delete()
        .eq("id", aposta.id)
        .eq("user_id", usuario.id);

      if (error) throw error;
      setApostas((estadoAtual) =>
        estadoAtual.filter((item) => item.id !== aposta.id)
      );
      setSucesso("Aposta excluída com sucesso.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a aposta."
      );
    } finally {
      setProcessandoId(null);
    }
  }

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Apostas</h1>
            <p className="mt-2 text-zinc-500">
              Registre confrontos e acompanhe lucro, prejuízo e ROI.
            </p>
          </div>

          <button
            type="button"
            onClick={abrirNovoCadastro}
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white"
          >
            + Nova aposta
          </button>
        </header>

        {carregandoDica && (
          <div className="mt-6 rounded-2xl border border-blue-900/60 bg-blue-950/30 px-5 py-4 text-sm text-blue-300">
            Carregando dados da dica...
          </div>
        )}

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-900/70 bg-red-950/40 px-5 py-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="mt-6 rounded-2xl border border-emerald-900/70 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-300">
            {sucesso}
          </div>
        )}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <CardResumoAposta titulo="Total apostado" valor={resumo.totalApostado} descricao="Finalizadas" icone="R$" destaque="neutro" />
          <CardResumoAposta titulo="Retorno total" valor={resumo.retornoTotal} descricao="Recebido" icone="↩" destaque="neutro" />
          <CardResumoAposta titulo="Lucro ou prejuízo" valor={resumo.lucroPrejuizo} descricao="Acumulado" icone="↗" destaque={resumo.lucroPrejuizo >= 0 ? "positivo" : "negativo"} />
          <CardResumoAposta titulo="ROI" percentual={resumo.roi} descricao="Retorno" icone="%" destaque={resumo.roi >= 0 ? "positivo" : "negativo"} />
          <CardResumoAposta titulo="Pendentes" quantidade={resumo.quantidadePendentes} descricao="Aguardando" icone="⌛" destaque="neutro" />
          <CardResumoAposta titulo="Ganhas" quantidade={resumo.quantidadeGanhas} descricao="Positivas" icone="✓" destaque="positivo" />
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px_180px]">
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar..."
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white"
            />
            <select
              value={competicao}
              onChange={(event) => setCompeticao(event.target.value)}
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white"
            >
              <option value="todas">Todas as competições</option>
              {competicoesDisponiveis.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={resultado}
              onChange={(event) => setResultado(event.target.value as FiltroResultadoAposta)}
              className="rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="ganha">Ganhas</option>
              <option value="perdida">Perdidas</option>
              <option value="anulada">Anuladas</option>
            </select>
          </div>
        </section>

        <section className="mt-8">
          <ListaApostas
            apostas={apostasFiltradas}
            carregando={carregando}
            processandoId={processandoId}
            onEditar={abrirEdicao}
            onExcluir={excluirAposta}
          />
        </section>
      </div>

      <ModalAposta
        aberto={modalAberto}
        titulo={
          apostaSelecionada
            ? "Editar aposta"
            : dicaOrigem
              ? "Usar dica como aposta"
              : "Nova aposta"
        }
        onFechar={fecharModal}
      >
        <FormularioAposta
          aposta={apostaSelecionada}
          dicaOrigem={dicaOrigem}
          carregandoExterno={carregandoDica}
          onConcluido={concluirSalvamento}
          onCancelar={fecharModal}
        />
      </ModalAposta>
    </main>
  );
}
