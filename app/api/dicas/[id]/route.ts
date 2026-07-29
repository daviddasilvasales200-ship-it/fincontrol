import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ContextoRota = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const supabase =
      await createClient();

    const {
      data: { user },
      error: erroUsuario,
    } = await supabase.auth.getUser();

    if (erroUsuario || !user) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Usuário não autenticado.",
        },
        {
          status: 401,
        }
      );
    }

    const { id } =
      await contexto.params;

    const dicaId = Number(id);

    if (
      !Number.isInteger(dicaId) ||
      dicaId <= 0
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Identificador da dica inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const admin =
      createAdminClient();

    const {
      data: dicaExistente,
      error: erroConsulta,
    } = await admin
      .from("dicas_apostas")
      .select(
        `
          id,
          time_casa,
          time_visitante
        `
      )
      .eq("id", dicaId)
      .maybeSingle();

    if (erroConsulta) {
      console.error(
        "Erro ao localizar dica:",
        erroConsulta
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Não foi possível localizar a dica.",
        },
        {
          status: 500,
        }
      );
    }

    if (!dicaExistente) {
      return NextResponse.json(
        {
          sucesso: false,
          erro: "Dica não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    const { error: erroExclusao } =
      await admin
        .from("dicas_apostas")
        .delete()
        .eq("id", dicaId);

    if (erroExclusao) {
      console.error(
        "Erro ao excluir dica:",
        erroExclusao
      );

      return NextResponse.json(
        {
          sucesso: false,
          erro:
            "Não foi possível excluir a dica.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      sucesso: true,

      mensagem:
        "Dica excluída com sucesso.",

      dicaExcluida: {
        id: dicaExistente.id,

        confronto:
          `${dicaExistente.time_casa} x ${dicaExistente.time_visitante}`,
      },
    });
  } catch (error) {
    console.error(
      "Erro inesperado ao excluir dica:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,

        erro:
          error instanceof Error
            ? error.message
            : "Não foi possível excluir a dica.",
      },
      {
        status: 500,
      }
    );
  }
}