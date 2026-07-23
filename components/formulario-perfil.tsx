"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type FormularioPerfilProps = {
  userId: string;
  email: string;
  nomeInicial: string;
  avatarInicial: string;
};

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/*
 * Ajuste os caminhos abaixo para os nomes reais
 * dos avatares que já existem na pasta public.
 *
 * Estrutura esperada:
 *
 * public/
 * └── avatares/
 *     ├── avatar-1.png
 *     ├── avatar-2.png
 *     ├── avatar-3.png
 *     ├── avatar-4.png
 *     ├── avatar-5.png
 *     └── avatar-6.png
 */
const AVATARES_DISPONIVEIS = [
  {
    nome: "Avatar 1",
    caminho: "/avatars/avatar01.png",
  },
  {
    nome: "Avatar 2",
    caminho: "/avatars/avatar02.png",
  },
  {
    nome: "Avatar 3",
    caminho: "/avatars/avatar03.png",
  },
  {
    nome: "Avatar 4",
    caminho: "/avatars/avatar04.png",
  },
  {
    nome: "Avatar 5",
    caminho: "/avatars/avatar05.png",
  },
  {
    nome: "Avatar 6",
    caminho: "/avatars/avatar06.png",
  },
];

export default function FormularioPerfil({
  userId,
  email,
  nomeInicial,
  avatarInicial,
}: FormularioPerfilProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [nome, setNome] = useState(nomeInicial);
  const [avatarAtual, setAvatarAtual] =
    useState(avatarInicial);

  const [avatarSelecionado, setAvatarSelecionado] =
    useState("");

  const [arquivo, setArquivo] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState(avatarInicial);

  const [salvando, setSalvando] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    if (!arquivo) {
      if (avatarSelecionado) {
        setPreview(avatarSelecionado);
      } else {
        setPreview(avatarAtual);
      }

      return;
    }

    const urlTemporaria =
      URL.createObjectURL(arquivo);

    setPreview(urlTemporaria);

    return () => {
      URL.revokeObjectURL(urlTemporaria);
    };
  }, [
    arquivo,
    avatarSelecionado,
    avatarAtual,
  ]);

  function selecionarArquivo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivoSelecionado =
      event.target.files?.[0];

    setErro("");
    setMensagem("");

    if (!arquivoSelecionado) {
      return;
    }

    if (
      !TIPOS_PERMITIDOS.includes(
        arquivoSelecionado.type
      )
    ) {
      setErro(
        "Selecione uma imagem nos formatos JPG, PNG ou WEBP."
      );

      event.target.value = "";
      return;
    }

    if (
      arquivoSelecionado.size >
      TAMANHO_MAXIMO
    ) {
      setErro(
        "A imagem deve ter no máximo 5 MB."
      );

      event.target.value = "";
      return;
    }

    setAvatarSelecionado("");
    setArquivo(arquivoSelecionado);
  }

  function selecionarAvatarPronto(
    caminho: string
  ) {
    setErro("");
    setMensagem("");
    setArquivo(null);
    setAvatarSelecionado(caminho);
    setPreview(caminho);
  }

  async function enviarAvatar() {
    if (avatarSelecionado) {
      return avatarSelecionado;
    }

    if (!arquivo) {
      return avatarAtual;
    }

    const extensao =
      arquivo.name
        .split(".")
        .pop()
        ?.toLowerCase() || "jpg";

    const caminhoArquivo =
      `${userId}/avatar.${extensao}`;

    const { error: erroUpload } =
      await supabase.storage
        .from("avatars")
        .upload(
          caminhoArquivo,
          arquivo,
          {
            cacheControl: "3600",
            upsert: true,
            contentType: arquivo.type,
          }
        );

    if (erroUpload) {
      throw new Error(
        `Erro ao enviar a imagem: ${erroUpload.message}`
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from("avatars")
      .getPublicUrl(caminhoArquivo);

    return `${publicUrl}?v=${Date.now()}`;
  }

  async function salvarPerfil(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const nomeLimpo = nome.trim();

    setErro("");
    setMensagem("");

    if (nomeLimpo.length < 2) {
      setErro(
        "Informe um nome com pelo menos 2 caracteres."
      );

      return;
    }

    setSalvando(true);

    try {
      const novaAvatarUrl =
        await enviarAvatar();

      const { error: erroAtualizacao } =
        await supabase.auth.updateUser({
          data: {
            nome: nomeLimpo,
            avatar_url: novaAvatarUrl,
          },
        });

      if (erroAtualizacao) {
        throw new Error(
          erroAtualizacao.message
        );
      }
const { error: erroSessao } =
  await supabase.auth.refreshSession();

if (erroSessao) {
  throw new Error(
    `Perfil salvo, mas não foi possível atualizar a sessão: ${erroSessao.message}`
  );
}
      setNome(nomeLimpo);
      setAvatarAtual(novaAvatarUrl);
      setAvatarSelecionado("");
      setArquivo(null);
      setPreview(novaAvatarUrl);

      setMensagem(
        "Perfil atualizado com sucesso."
      );

      router.refresh();
    } catch (erroDesconhecido) {
      const mensagemErro =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível atualizar o perfil.";

      setErro(mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  async function removerFoto() {
    setErro("");
    setMensagem("");
    setSalvando(true);

    try {
      /*
       * Tenta remover qualquer imagem enviada pelo
       * usuário dentro da própria pasta no Storage.
       *
       * Avatares prontos da pasta public não são
       * removidos, pois não estão no Storage.
       */
      const pasta = userId;

      const {
        data: arquivos,
        error: erroLista,
      } = await supabase.storage
        .from("avatars")
        .list(pasta);

      if (erroLista) {
        throw new Error(
          erroLista.message
        );
      }

      const caminhos =
        arquivos?.map(
          (item) =>
            `${pasta}/${item.name}`
        ) ?? [];

      if (caminhos.length > 0) {
        const {
          error: erroRemocao,
        } = await supabase.storage
          .from("avatars")
          .remove(caminhos);

        if (erroRemocao) {
          throw new Error(
            erroRemocao.message
          );
        }
      }

      const {
        error: erroAtualizacao,
      } = await supabase.auth.updateUser({
        data: {
          nome:
            nome.trim() ||
            nomeInicial,
          avatar_url: "",
        },
      });

      if (erroAtualizacao) {
        throw new Error(
          erroAtualizacao.message
        );
      }

      setArquivo(null);
      setAvatarSelecionado("");
      setAvatarAtual("");
      setPreview("");

      setMensagem(
        "Foto de perfil removida."
      );

      router.refresh();
    } catch (erroDesconhecido) {
      const mensagemErro =
        erroDesconhecido instanceof Error
          ? erroDesconhecido.message
          : "Não foi possível remover a foto.";

      setErro(mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  const inicial =
    nome
      .trim()
      .charAt(0)
      .toUpperCase() || "U";

  return (
    <form
      onSubmit={salvarPerfil}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="Prévia da foto de perfil"
                className="h-28 w-28 rounded-full border-4 border-red-500/60 object-cover ring-8 ring-red-500/10"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-900 text-4xl font-bold ring-8 ring-red-500/10">
                {inicial}
              </div>
            )}

            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-zinc-950 bg-emerald-500" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold">
              Foto de perfil
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Envie uma imagem JPG, PNG ou
              WEBP com até 5 MB ou escolha
              um avatar pronto.
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <label className="cursor-pointer rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold transition hover:bg-red-500">
                Enviar minha foto

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    selecionarArquivo
                  }
                  disabled={salvando}
                  className="hidden"
                />
              </label>

              {(preview ||
                avatarAtual ||
                avatarSelecionado) && (
                <button
                  type="button"
                  onClick={removerFoto}
                  disabled={salvando}
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:border-red-500 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remover foto
                </button>
              )}
            </div>

            {arquivo && (
              <p className="mt-3 truncate text-xs text-zinc-500">
                Arquivo selecionado:{" "}
                {arquivo.name}
              </p>
            )}

            <div className="mt-7 border-t border-zinc-800 pt-6">
              <div>
                <p className="text-sm font-semibold text-zinc-200">
                  Escolha um avatar
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Selecione uma das opções
                  prontas do FinControl.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {AVATARES_DISPONIVEIS.map(
                  (avatar) => {
                    const selecionado =
                      avatarSelecionado ===
                        avatar.caminho ||
                      (!avatarSelecionado &&
                        avatarAtual ===
                          avatar.caminho);

                    return (
                      <button
                        key={
                          avatar.caminho
                        }
                        type="button"
                        onClick={() =>
                          selecionarAvatarPronto(
                            avatar.caminho
                          )
                        }
                        disabled={salvando}
                        aria-label={`Selecionar ${avatar.nome}`}
                        aria-pressed={
                          selecionado
                        }
                        className={`group relative aspect-square overflow-hidden rounded-2xl border-2 bg-black p-1 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 ${
                          selecionado
                            ? "border-red-500 ring-4 ring-red-500/15"
                            : "border-zinc-800 hover:border-zinc-600"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            avatar.caminho
                          }
                          alt={avatar.nome}
                          className="h-full w-full rounded-xl object-cover"
                        />

                        {selecionado && (
                          <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-black bg-red-600 text-xs font-bold text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-500">
            Dados pessoais
          </p>

          <h2 className="mt-2 text-xl font-semibold">
            Informações da conta
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Atualize o nome exibido em todo
            o FinControl.
          </p>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="nome"
              className="text-sm font-medium text-zinc-300"
            >
              Nome
            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(
                  event.target.value
                )
              }
              maxLength={80}
              disabled={salvando}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition placeholder:text-zinc-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/10 disabled:opacity-60"
              placeholder="Seu nome"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-300"
            >
              E-mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              readOnly
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-zinc-500 outline-none"
            />

            <p className="mt-2 text-xs text-zinc-600">
              A alteração do e-mail poderá
              ser adicionada posteriormente.
            </p>
          </div>
        </div>
      </section>

      {erro && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {mensagem}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-xl bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando
            ? "Salvando..."
            : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}