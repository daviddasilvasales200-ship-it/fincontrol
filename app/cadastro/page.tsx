"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024;

const TIPOS_FOTO_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type AvatarId =
  | "avatar-01"
  | "avatar-02"
  | "avatar-03"
  | "avatar-04"
  | "avatar-05"
  | "avatar-06";

type AvatarOpcao = {
  id: AvatarId;
  nome: string;
  src: string;
};

const AVATARES: AvatarOpcao[] = [
  {
    id: "avatar-01",
    nome: "Avatar 01",
    src: "/avatars/avatar01.png",
  },
  {
    id: "avatar-02",
    nome: "Avatar 02",
    src: "/avatars/avatar02.png",
  },
  {
    id: "avatar-03",
    nome: "Avatar 03",
    src: "/avatars/avatar03.png",
  },
  {
    id: "avatar-04",
    nome: "Avatar 04",
    src: "/avatars/avatar04.png",
  },
  {
    id: "avatar-05",
    nome: "Avatar 05",
    src: "/avatars/avatar05.png",
  },
  {
    id: "avatar-06",
    nome: "Avatar 06",
    src: "/avatars/avatar06.png",
  },
];

export default function PaginaCadastro() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [avatarSelecionado, setAvatarSelecionado] =
    useState<AvatarId | null>(null);

  const [foto, setFoto] = useState<File | null>(null);
  const [previewFoto, setPreviewFoto] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const forcaSenha = useMemo(
    () => calcularForcaSenha(senha),
    [senha]
  );

  const avatarAtual = useMemo(() => {
    return (
      AVATARES.find(
        (avatar) => avatar.id === avatarSelecionado
      ) ?? null
    );
  }, [avatarSelecionado]);

  useEffect(() => {
    return () => {
      if (previewFoto) {
        URL.revokeObjectURL(previewFoto);
      }
    };
  }, [previewFoto]);

  function selecionarAvatar(id: AvatarId) {
    if (previewFoto) {
      URL.revokeObjectURL(previewFoto);
    }

    setFoto(null);
    setPreviewFoto("");
    setAvatarSelecionado(id);
    setMensagem("");
    setSucesso(false);
  }

  function selecionarFoto(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    if (!TIPOS_FOTO_PERMITIDOS.includes(arquivo.type)) {
      setMensagem(
        "Selecione uma imagem no formato JPG, PNG ou WebP."
      );

      event.target.value = "";
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
      setMensagem(
        "A imagem deve possuir no máximo 2 MB."
      );

      event.target.value = "";
      return;
    }

    if (previewFoto) {
      URL.revokeObjectURL(previewFoto);
    }

    setAvatarSelecionado(null);
    setFoto(arquivo);
    setPreviewFoto(URL.createObjectURL(arquivo));
    setMensagem("");
    setSucesso(false);
  }

  function removerAvatarOuFoto() {
    if (previewFoto) {
      URL.revokeObjectURL(previewFoto);
    }

    setAvatarSelecionado(null);
    setFoto(null);
    setPreviewFoto("");
    setMensagem("");
    setSucesso(false);
  }

  async function enviarFotoPersonalizada(
    userId: string,
    arquivo: File
  ): Promise<string | null> {
    const extensaoOriginal =
      arquivo.name.split(".").pop()?.toLowerCase();

    const extensao =
      extensaoOriginal &&
      ["jpg", "jpeg", "png", "webp"].includes(
        extensaoOriginal
      )
        ? extensaoOriginal
        : "jpg";

    const caminho =
      `${userId}/avatar-${Date.now()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from("avatars")
      .upload(caminho, arquivo, {
        cacheControl: "3600",
        upsert: false,
        contentType: arquivo.type,
      });

    if (erroUpload) {
      console.error(
        "Erro ao enviar foto personalizada:",
        erroUpload
      );

      return null;
    }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(caminho);

    return data.publicUrl;
  }

  async function cadastrar(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMensagem("");
    setSucesso(false);

    const nomeTratado = nome.trim();
    const emailTratado = email.trim().toLowerCase();

    if (nomeTratado.length < 3) {
      setMensagem("Digite seu nome completo.");
      return;
    }

    if (!emailTratado) {
      setMensagem("Digite um e-mail válido.");
      return;
    }

    if (senha.length < 8) {
      setMensagem(
        "A senha deve possuir pelo menos 8 caracteres."
      );

      return;
    }

    if (forcaSenha.pontos < 3) {
      setMensagem(
        "Use uma senha mais segura, combinando letras e números."
      );

      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem(
        "As senhas informadas não são iguais."
      );

      return;
    }

    if (!aceitouTermos) {
      setMensagem(
        "Você precisa aceitar os termos de uso para continuar."
      );

      return;
    }

    setCarregando(true);

    try {
      const origem = window.location.origin;

      const avatarPredefinidoUrl =
        avatarAtual?.src ?? null;

      const { data, error } = await supabase.auth.signUp({
        email: emailTratado,
        password: senha,
        options: {
          emailRedirectTo: `${origem}/login`,
          data: {
            nome: nomeTratado,
            nome_completo: nomeTratado,

            avatar_id: avatarSelecionado,

            avatar_tipo: avatarSelecionado
              ? "predefinido"
              : foto
                ? "personalizado"
                : null,

            avatar_url: avatarPredefinidoUrl,
          },
        },
      });

      if (error) {
        console.error("Erro no cadastro:", error);

        const erroTratado =
          error.message.toLowerCase();

        if (
          erroTratado.includes("already registered") ||
          erroTratado.includes(
            "already been registered"
          ) ||
          erroTratado.includes(
            "user already registered"
          )
        ) {
          setMensagem(
            "Já existe uma conta cadastrada com esse e-mail."
          );

          return;
        }

        if (erroTratado.includes("password")) {
          setMensagem(
            "A senha informada não atende aos requisitos de segurança."
          );

          return;
        }

        setMensagem(error.message);
        return;
      }

      if (!data.user) {
        setMensagem(
          "Não foi possível identificar o usuário criado."
        );

        return;
      }

      let avatarUrl: string | null =
        avatarPredefinidoUrl;

      let erroNoAvatar = false;

      /*
       * A foto enviada pelo usuário precisa de uma sessão
       * autenticada para ser salva no Storage.
       *
       * Quando a confirmação de e-mail está ativada,
       * data.session normalmente será null.
       */
      if (foto && data.session) {
        avatarUrl =
          await enviarFotoPersonalizada(
            data.user.id,
            foto
          );

        if (!avatarUrl) {
          erroNoAvatar = true;
        } else {
          const { error: erroMetadados } =
            await supabase.auth.updateUser({
              data: {
                nome: nomeTratado,
                nome_completo: nomeTratado,
                avatar_id: null,
                avatar_tipo: "personalizado",
                avatar_url: avatarUrl,
              },
            });

          if (erroMetadados) {
            console.error(
              "Erro ao salvar os dados do avatar:",
              erroMetadados
            );

            erroNoAvatar = true;
          }
        }
      }

      setSucesso(true);

      if (data.session) {
        if (erroNoAvatar) {
          setMensagem(
            "Conta criada, mas não conseguimos salvar sua foto. Você poderá adicioná-la depois no perfil."
          );
        } else {
          setMensagem(
            "Conta criada com sucesso! Abrindo seu painel..."
          );
        }

        window.setTimeout(() => {
          router.replace("/dashboard");
          router.refresh();
        }, 1600);

        return;
      }

      if (foto) {
        setMensagem(
          "Conta criada! Confirme seu e-mail para acessar o FinControl. A foto personalizada poderá ser adicionada novamente no perfil."
        );
      } else {
        setMensagem(
          "Conta criada! Enviamos um link de confirmação para seu e-mail. Verifique também a pasta de spam."
        );
      }

      setNome("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
      setAceitouTermos(false);

      removerAvatarOuFoto();
    } catch (erro) {
      console.error(
        "Erro inesperado no cadastro:",
        erro
      );

      setMensagem(
        erro instanceof Error
          ? erro.message
          : "Não foi possível criar sua conta."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <FundoDecorativo />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.88fr_1.12fr]">
        {/* Coluna esquerda */}
        <section className="hidden min-h-screen items-center justify-center border-r border-zinc-900 px-12 lg:flex">
          <div className="max-w-md text-center">
            <LogoGrande />

            <h1 className="mt-10 text-4xl font-black tracking-tight xl:text-5xl">
              Comece a controlar sua{" "}
              <span className="text-red-500">
                vida financeira.
              </span>
            </h1>

            <p className="mt-5 text-base leading-7 text-zinc-500">
              Registre seus gastos, acompanhe
              parcelamentos e organize suas assinaturas
              em um só lugar.
            </p>

            <div className="mt-8 space-y-3 text-left">
              <Beneficio texto="Controle completo dos gastos mensais" />

              <Beneficio texto="Dados protegidos por usuário" />

              <Beneficio texto="Acesso pelo computador e celular" />
            </div>
          </div>
        </section>

        {/* Coluna do cadastro */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-xl">
            <div className="mb-8 flex justify-center lg:hidden">
              <LogoCompacta />
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-8">
              <header>
                <p className="text-sm font-semibold text-red-500">
                  Crie sua conta
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  Bem-vindo ao FinControl
                </h2>

                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  Escolha seu avatar e preencha seus
                  dados para começar.
                </p>
              </header>

              <form
                onSubmit={cadastrar}
                className="mt-8 space-y-5"
              >
                <SeletorAvatares
                  avatarSelecionado={
                    avatarSelecionado
                  }
                  avatarAtual={avatarAtual}
                  previewFoto={previewFoto}
                  temSelecao={Boolean(
                    avatarSelecionado || foto
                  )}
                  onSelecionarAvatar={
                    selecionarAvatar
                  }
                  onSelecionarFoto={
                    selecionarFoto
                  }
                  onRemover={
                    removerAvatarOuFoto
                  }
                />

                <CampoTexto
                  id="nome"
                  label="Nome completo"
                  type="text"
                  value={nome}
                  onChange={setNome}
                  placeholder="Digite seu nome"
                  autoComplete="name"
                  icone={<IconeUsuario />}
                />

                <CampoTexto
                  id="email"
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="seuemail@exemplo.com"
                  autoComplete="email"
                  icone={<IconeEmail />}
                />

                <CampoSenha
                  id="senha"
                  label="Senha"
                  value={senha}
                  onChange={setSenha}
                  mostrar={mostrarSenha}
                  onAlternar={() =>
                    setMostrarSenha(
                      (estado) => !estado
                    )
                  }
                />

                <IndicadorForcaSenha
                  pontos={forcaSenha.pontos}
                  texto={forcaSenha.texto}
                />

                <CampoSenha
                  id="confirmar-senha"
                  label="Confirmar senha"
                  value={confirmarSenha}
                  onChange={setConfirmarSenha}
                  mostrar={mostrarConfirmacao}
                  onAlternar={() =>
                    setMostrarConfirmacao(
                      (estado) => !estado
                    )
                  }
                />

                {confirmarSenha && (
                  <p
                    className={`text-xs ${
                      senha === confirmarSenha
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {senha === confirmarSenha
                      ? "As senhas são iguais."
                      : "As senhas ainda não são iguais."}
                  </p>
                )}

                <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-zinc-500">
                  <input
                    type="checkbox"
                    checked={aceitouTermos}
                    onChange={(event) =>
                      setAceitouTermos(
                        event.target.checked
                      )
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-red-600"
                  />

                  <span>
                    Li e aceito os{" "}
                    <button
                      type="button"
                      className="font-semibold text-red-500 transition hover:text-red-400"
                    >
                      termos de uso
                    </button>{" "}
                    e a{" "}
                    <button
                      type="button"
                      className="font-semibold text-red-500 transition hover:text-red-400"
                    >
                      política de privacidade
                    </button>
                    .
                  </span>
                </label>

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
                  disabled={carregando || sucesso}
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-red-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-red-950/40 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {carregando ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar minha conta

                      <span className="transition group-hover:translate-x-1">
                        →
                      </span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 border-t border-zinc-800 pt-6 text-center">
                <p className="text-sm text-zinc-500">
                  Já possui uma conta?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-red-500 transition hover:text-red-400"
                  >
                    Entrar
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

type SeletorAvataresProps = {
  avatarSelecionado: AvatarId | null;
  avatarAtual: AvatarOpcao | null;
  previewFoto: string;
  temSelecao: boolean;
  onSelecionarAvatar: (id: AvatarId) => void;
  onSelecionarFoto: (
    event: ChangeEvent<HTMLInputElement>
  ) => void;
  onRemover: () => void;
};

function SeletorAvatares({
  avatarSelecionado,
  avatarAtual,
  previewFoto,
  temSelecao,
  onSelecionarAvatar,
  onSelecionarFoto,
  onRemover,
}: SeletorAvataresProps) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-black/30 p-5">
      <div className="flex flex-col items-center">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-zinc-700 bg-black shadow-xl shadow-black/50">
            {previewFoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewFoto}
                alt="Prévia da foto de perfil"
                className="h-full w-full object-cover object-center"
              />
            ) : avatarAtual ? (
              <ImagemAvatar
                src={avatarAtual.src}
                nome={avatarAtual.nome}
                tamanhoGrande
              />
            ) : (
              <IconeUsuarioGrande />
            )}
          </div>

          <label
            htmlFor="foto-perfil"
            title="Enviar foto personalizada"
            className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-4 border-zinc-950 bg-red-600 text-white shadow-lg transition hover:bg-red-500"
          >
            <IconeCamera />

            <input
              id="foto-perfil"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onSelecionarFoto}
              className="sr-only"
            />
          </label>
        </div>

        <p className="mt-3 text-sm font-medium text-zinc-300">
          Escolha seu avatar
        </p>

        <p className="mt-1 text-center text-xs text-zinc-600">
          Selecione uma opção pronta ou envie sua
          própria foto.
        </p>

        {temSelecao && (
          <button
            type="button"
            onClick={onRemover}
            className="mt-2 text-xs font-semibold text-red-500 transition hover:text-red-400"
          >
            Remover seleção
          </button>
        )}
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-medium text-zinc-300">
          Avatares disponíveis
        </p>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {AVATARES.map((avatar) => {
            const selecionado =
              avatarSelecionado === avatar.id;

            return (
              <button
                key={avatar.id}
                type="button"
                title={avatar.nome}
                aria-label={`Selecionar ${avatar.nome}`}
                onClick={() =>
                  onSelecionarAvatar(avatar.id)
                }
                className={`aspect-square overflow-hidden rounded-full border-2 bg-black p-1 transition ${
                  selecionado
                    ? "scale-105 border-red-500 shadow-lg shadow-red-950/50"
                    : "border-zinc-800 hover:scale-105 hover:border-zinc-600"
                }`}
              >
                <ImagemAvatar
                  src={avatar.src}
                  nome={avatar.nome}
                />
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-zinc-700">
        Foto personalizada: JPG, PNG ou WebP, até 2 MB.
      </p>
    </section>
  );
}

function ImagemAvatar({
  src,
  nome,
  tamanhoGrande = false,
}: {
  src: string;
  nome: string;
  tamanhoGrande?: boolean;
}) {
  const [erro, setErro] = useState(false);

  if (erro) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-full bg-zinc-900 text-sm font-bold text-red-500">
        {nome.replace("Avatar ", "")}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={nome}
      draggable={false}
      onError={() => setErro(true)}
      className={`h-full w-full rounded-full object-cover object-center ${
        tamanhoGrande ? "scale-[1.02]" : ""
      }`}
    />
  );
}

type CampoTextoProps = {
  id: string;
  label: string;
  type: "text" | "email";
  value: string;
  onChange: (valor: string) => void;
  placeholder: string;
  autoComplete: string;
  icone: React.ReactNode;
};

function CampoTexto({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  icone,
}: CampoTextoProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
          {icone}
        </span>

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full rounded-xl border border-zinc-700 bg-black py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-zinc-700 hover:border-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
        />
      </div>
    </div>
  );
}

type CampoSenhaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  mostrar: boolean;
  onAlternar: () => void;
};

function CampoSenha({
  id,
  label,
  value,
  onChange,
  mostrar,
  onAlternar,
}: CampoSenhaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        {label}
      </label>

      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
          <IconeCadeado />
        </span>

        <input
          id={id}
          type={mostrar ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          required
          minLength={8}
          className="w-full rounded-xl border border-zinc-700 bg-black py-3.5 pl-12 pr-12 text-white outline-none transition placeholder:text-zinc-700 hover:border-zinc-600 focus:border-red-600 focus:ring-2 focus:ring-red-600/20"
        />

        <button
          type="button"
          onClick={onAlternar}
          aria-label={
            mostrar
              ? "Ocultar senha"
              : "Mostrar senha"
          }
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
        >
          {mostrar ? (
            <IconeOlhoFechado />
          ) : (
            <IconeOlho />
          )}
        </button>
      </div>
    </div>
  );
}

function calcularForcaSenha(senha: string) {
  const criterios = [
    senha.length >= 8,
    /[a-z]/.test(senha),
    /[A-Z]/.test(senha),
    /\d/.test(senha),
    /[^A-Za-z0-9]/.test(senha),
  ];

  const pontos = criterios.filter(Boolean).length;

  if (pontos <= 2) {
    return {
      pontos,
      texto: "Senha fraca",
    };
  }

  if (pontos <= 4) {
    return {
      pontos,
      texto: "Senha média",
    };
  }

  return {
    pontos,
    texto: "Senha forte",
  };
}

function IndicadorForcaSenha({
  pontos,
  texto,
}: {
  pontos: number;
  texto: string;
}) {
  const largura = `${(pontos / 5) * 100}%`;

  const cor =
    pontos <= 2
      ? "bg-red-600"
      : pontos <= 4
        ? "bg-amber-500"
        : "bg-emerald-500";

  const corTexto =
    pontos <= 2
      ? "text-red-400"
      : pontos <= 4
        ? "text-amber-400"
        : "text-emerald-400";

  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${cor}`}
          style={{ width: largura }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-4">
        <p
          className={`text-xs font-medium ${corTexto}`}
        >
          {texto}
        </p>

        <p className="text-xs text-zinc-600">
          Use letras, números e símbolos
        </p>
      </div>
    </div>
  );
}

function FundoDecorativo() {
  return (
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
  );
}

function LogoGrande() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-52 w-52 items-end justify-center gap-3 rounded-[2.5rem] border border-red-900/40 bg-gradient-to-b from-zinc-950 to-black p-9 shadow-2xl shadow-red-950/40">
        <span className="h-14 w-7 rounded-t-xl bg-red-800" />
        <span className="h-20 w-7 rounded-t-xl bg-red-700" />
        <span className="h-28 w-7 rounded-t-xl bg-red-600" />
        <span className="h-36 w-7 rounded-t-xl bg-red-400" />
      </div>

      <p className="mt-7 text-5xl font-black tracking-tight">
        <span className="text-white">
          Fin
        </span>

        <span className="text-red-500">
          Control
        </span>
      </p>
    </div>
  );
}

function LogoCompacta() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-12 w-12 items-end justify-center gap-1 rounded-xl bg-red-600 p-2.5">
        <span className="h-3 w-1.5 rounded-t bg-white/70" />
        <span className="h-5 w-1.5 rounded-t bg-white/80" />
        <span className="h-7 w-1.5 rounded-t bg-white/90" />
        <span className="h-9 w-1.5 rounded-t bg-white" />
      </div>

      <p className="text-2xl font-black">
        <span className="text-white">
          Fin
        </span>

        <span className="text-red-500">
          Control
        </span>
      </p>
    </div>
  );
}

function Beneficio({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-900 bg-zinc-950/50 px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-950 text-sm text-red-500">
        ✓
      </span>

      <p className="text-sm text-zinc-400">
        {texto}
      </p>
    </div>
  );
}

function IconeUsuario() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4 21a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeUsuarioGrande() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-12 w-12 text-zinc-700"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M4.5 21a7.5 7.5 0 0 1 15 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeCamera() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="13"
        r="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
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