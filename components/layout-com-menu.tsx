"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type LayoutComMenuProps = {
  children: ReactNode;
};

type ItemMenu = {
  nome: string;
  icone: string;
  href: string;
};

const itensMenu: ItemMenu[] = [
  {
    nome: "Dashboard",
    icone: "⌂",
    href: "/dashboard",
  },
  {
    nome: "Receitas",
    icone: "↗",
    href: "/receitas",
  },
  {
    nome: "Despesas",
    icone: "↘",
    href: "/despesas",
  },
  {
    nome: "Parcelamentos",
    icone: "▦",
    href: "/parcelamentos",
  },
  {
    nome: "Assinaturas",
    icone: "◎",
    href: "/assinaturas",
  },
  {
    nome: "Investimentos",
    icone: "▥",
    href: "/investimentos",
  },
  {
    nome: "Apostas",
    icone: "◆",
    href: "/apostas",
  },
  {
    nome: "Relatórios",
    icone: "▤",
    href: "/relatorios",
  },
];

export default function LayoutComMenu({
  children,
}: LayoutComMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [menuAberto, setMenuAberto] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] =
    useState(false);

  function rotaAtiva(href: string) {
    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  function anteciparRota(href: string) {
    router.prefetch(href);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        {/* Menu desktop */}
        <aside
          className={`hidden shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-[width] duration-300 lg:flex ${
            menuAberto ? "w-72" : "w-20"
          }`}
        >
          <div
            className={`flex items-center border-b border-zinc-800 px-4 py-6 ${
              menuAberto
                ? "justify-between"
                : "justify-center"
            }`}
          >
            {menuAberto && (
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-red-600">
                  FinControl
                </h1>

                <p className="mt-1 truncate text-sm text-zinc-500">
                  Controle financeiro inteligente
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                setMenuAberto((aberto) => !aberto)
              }
              aria-label={
                menuAberto
                  ? "Ocultar menu lateral"
                  : "Mostrar menu lateral"
              }
              title={
                menuAberto
                  ? "Ocultar menu"
                  : "Mostrar menu"
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/40"
            >
              {menuAberto ? "‹" : "›"}
            </button>
          </div>

          <nav
            aria-label="Menu principal"
            className="flex-1 space-y-2 px-3 py-6"
          >
            {itensMenu.map((item) => {
              const ativo = rotaAtiva(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    ativo ? "page" : undefined
                  }
                  title={
                    !menuAberto
                      ? item.nome
                      : undefined
                  }
                  onMouseEnter={() =>
                    anteciparRota(item.href)
                  }
                  onFocus={() =>
                    anteciparRota(item.href)
                  }
                  className={`flex items-center rounded-xl py-3 transition ${
                    menuAberto
                      ? "gap-3 px-4"
                      : "justify-center px-2"
                  } ${
                    ativo
                      ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="text-lg"
                  >
                    {item.icone}
                  </span>

                  {menuAberto && (
                    <span className="text-sm font-medium">
                      {item.nome}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-zinc-800 p-3">
            <Link
              href="/configuracoes"
              aria-current={
                rotaAtiva("/configuracoes")
                  ? "page"
                  : undefined
              }
              title={
                !menuAberto
                  ? "Configurações"
                  : undefined
              }
              onMouseEnter={() =>
                anteciparRota("/configuracoes")
              }
              onFocus={() =>
                anteciparRota("/configuracoes")
              }
              className={`flex items-center rounded-xl py-3 transition ${
                menuAberto
                  ? "gap-3 px-4"
                  : "justify-center px-2"
              } ${
                rotaAtiva("/configuracoes")
                  ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <span
                aria-hidden="true"
                className="text-lg"
              >
                ⚙
              </span>

              {menuAberto && (
                <span className="text-sm font-medium">
                  Configurações
                </span>
              )}
            </Link>
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="min-w-0 flex-1">
          {/* Cabeçalho mobile */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur lg:hidden">
            <h1 className="text-xl font-bold text-red-600">
              FinControl
            </h1>

            <button
              type="button"
              onClick={() =>
                setMenuMobileAberto(
                  (aberto) => !aberto
                )
              }
              aria-label={
                menuMobileAberto
                  ? "Fechar menu"
                  : "Abrir menu"
              }
              aria-expanded={menuMobileAberto}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 text-zinc-300 transition hover:border-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-600/40"
            >
              ☰
            </button>
          </header>

          {/* Menu mobile */}
          {menuMobileAberto && (
            <div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm lg:hidden"
              onClick={() =>
                setMenuMobileAberto(false)
              }
            >
              <aside
                aria-label="Menu mobile"
                className="h-full w-72 border-r border-zinc-800 bg-zinc-950 p-4 shadow-2xl shadow-black"
                onClick={(event) =>
                  event.stopPropagation()
                }
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-red-600">
                      FinControl
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                      Controle financeiro
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMenuMobileAberto(false)
                    }
                    aria-label="Fechar menu"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                <nav
                  aria-label="Menu principal mobile"
                  className="mt-5 space-y-2"
                >
                  {itensMenu.map((item) => {
                    const ativo = rotaAtiva(
                      item.href
                    );

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={
                          ativo
                            ? "page"
                            : undefined
                        }
                        onMouseEnter={() =>
                          anteciparRota(item.href)
                        }
                        onFocus={() =>
                          anteciparRota(item.href)
                        }
                        onClick={() =>
                          setMenuMobileAberto(
                            false
                          )
                        }
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                          ativo
                            ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <span aria-hidden="true">
                          {item.icone}
                        </span>

                        <span className="text-sm font-medium">
                          {item.nome}
                        </span>
                      </Link>
                    );
                  })}

                  <Link
                    href="/configuracoes"
                    aria-current={
                      rotaAtiva(
                        "/configuracoes"
                      )
                        ? "page"
                        : undefined
                    }
                    onMouseEnter={() =>
                      anteciparRota(
                        "/configuracoes"
                      )
                    }
                    onFocus={() =>
                      anteciparRota(
                        "/configuracoes"
                      )
                    }
                    onClick={() =>
                      setMenuMobileAberto(false)
                    }
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                      rotaAtiva(
                        "/configuracoes"
                      )
                        ? "bg-red-600 text-white shadow-lg shadow-red-950/30"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span aria-hidden="true">
                      ⚙
                    </span>

                    <span className="text-sm font-medium">
                      Configurações
                    </span>
                  </Link>
                </nav>
              </aside>
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}