import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContextoRota = {
  params: Promise<{
    id: string;
  }>;
};

type DicaBanco = {
  id: number;
  user_id: string | null;
  fixture_id: number | null;
  mercado: string;
  entrada_sugerida: string;
  time_casa: string | null;
  time_visitante: string | null;
  data_jogo: string | null;
};

function respostaErro(
  erro: string,
  status: number,
  detalhes?: unknown
) {
  return NextResponse.json(
    {
      sucesso: false,
      erro,
      ...(detalhes !== undefined
        ? { detalhes }
        : {}),
    },
    { status }
  );
}

export async function DELETE(
  _request: Request,
  contexto: ContextoRota
) {
  try {
    const { id } = await contexto.params;
    const dicaId = Number(id);

    if (
      !Number.isInteger(dicaId) ||
      dicaId <= 0
    ) {
      return respostaErro(
        "O identificador da dica é inválido.",
        400
      );
    }

    const supabaseUsuario =
      await createClient();

    const {
      data: { user },
      error: erroUsuario,
    } = await supabaseUsuario.auth.getUser();

    if (erroUsuario) {
      console.error(
        "Erro ao validar usuário:",
        erroUsuario
      );

      return respostaErro(
        "Não foi possível validar sua sessão.",
        401
      );
    }

    if (!user) {
      return respostaErro(
        "Sua sessão expirou. Entre novamente.",
        401
      );
    }

    const supabaseAdmin =
      createAdminClient();

    const {
      data: dicaEncontrada,
      error: erroBuscarDica,
    } = await supabaseAdmin
      .from("dicas_apostas")
      .select(
        `
          id,
          user_id,
          fixture_id,
          mercado,
          entrada_sugerida,
          time_casa,
          time_visitante,
          data_jogo
        `
      )
      .eq("id", dicaId)
      .maybeSingle();

    if (erroBuscarDica) {
      console.error(
        `Erro ao buscar dica ${dicaId}:`,
        erroBuscarDica
      );

      return respostaErro(
        "Não foi possível localizar a dica.",
        500,
        erroBuscarDica.message
      );
    }

    if (!dicaEncontrada) {
      return respostaErro(
        "A dica não foi encontrada ou já foi excluída.",
        404
      );
    }

    const dica =
      dicaEncontrada as DicaBanco;

    /*
     * Dicas globais possuem user_id nulo.
     * Dicas particulares só podem ser removidas
     * pelo próprio usuário.
     */
    if (
      dica.user_id !== null &&
      dica.user_id !== user.id
    ) {
      return respostaErro(
        "Você não tem permissão para excluir esta dica.",
        403
      );
    }

    let bloqueioCriadoId:
      | number
      | null = null;

    const {
      data: bloqueioCriado,
      error: erroCriarBloqueio,
    } = await supabaseAdmin
      .from("dicas_bloqueadas")
      .insert({
        /*
         * Mantém o mesmo escopo da dica:
         * - dica global: user_id nulo;
         * - dica particular: user_id do dono.
         */
        user_id: dica.user_id,
        fixture_id: dica.fixture_id,
        mercado: dica.mercado.trim(),
        entrada_sugerida:
          dica.entrada_sugerida.trim(),
        time_casa:
          dica.time_casa?.trim() || null,
        time_visitante:
          dica.time_visitante?.trim() || null,
        data_jogo: dica.data_jogo,
        motivo: "excluida_pelo_usuario",
      })
      .select("id")
      .single();

    if (erroCriarBloqueio) {
      /*
       * O código 23505 indica que o bloqueio já
       * existe. Nesse caso podemos excluir a dica
       * normalmente, pois ela já está protegida
       * contra recriação.
       */
      if (erroCriarBloqueio.code !== "23505") {
        console.error(
          `Erro ao bloquear dica ${dicaId}:`,
          erroCriarBloqueio
        );

        return respostaErro(
          "Não foi possível registrar o bloqueio da dica.",
          500,
          erroCriarBloqueio.message
        );
      }
    } else {
      bloqueioCriadoId = Number(
        bloqueioCriado.id
      );
    }

    const { error: erroExcluirDica } =
      await supabaseAdmin
        .from("dicas_apostas")
        .delete()
        .eq("id", dicaId);

    if (erroExcluirDica) {
      console.error(
        `Erro ao excluir dica ${dicaId}:`,
        erroExcluirDica
      );

      /*
       * Se o bloqueio foi criado nesta mesma
       * requisição, removemos para evitar que a
       * dica permaneça bloqueada sem ter sido
       * realmente excluída.
       */
      if (bloqueioCriadoId !== null) {
        const { error: erroDesfazerBloqueio } =
          await supabaseAdmin
            .from("dicas_bloqueadas")
            .delete()
            .eq("id", bloqueioCriadoId);

        if (erroDesfazerBloqueio) {
          console.error(
            `Erro ao desfazer bloqueio ${bloqueioCriadoId}:`,
            erroDesfazerBloqueio
          );
        }
      }

      return respostaErro(
        "Não foi possível excluir a dica.",
        500,
        erroExcluirDica.message
      );
    }

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "Dica excluída e bloqueada para não ser criada novamente.",
      dicaExcluida: {
        id: dica.id,
        fixture_id: dica.fixture_id,
        mercado: dica.mercado,
        entrada_sugerida:
          dica.entrada_sugerida,
      },
      bloqueioRegistrado: true,
    });
  } catch (error) {
    console.error(
      "Erro inesperado ao excluir dica:",
      error
    );

    return respostaErro(
      error instanceof Error
        ? error.message
        : "Ocorreu um erro inesperado ao excluir a dica.",
      500
    );
  }
}
