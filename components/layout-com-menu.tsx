"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";

type LayoutComMenuProps = {
  children: ReactNode;
};

const itensMenu = [
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

  const [menuAberto, setMenuAberto] = useState(true);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  function rotaAtiva(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside
          className={`hidden shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 lg:flex ${
            menuAberto ? "w-72" : "w-20"
          }`}
        >
          <div
            className={`flex items-center border-b border-zinc-800 px-4 py-6 ${
              menuAberto ? "justify-between" : "justify-center"
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
              onClick={() => setMenuAberto((aberto) => !aberto)}
              title={menuAberto ? "Ocultar menu" : "Mostrar menu"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-700 text-zinc-400 transition hover:border-red-600 hover:text-red-500"
            >
              {menuAberto ? "‹" : "›"}
            </button>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-6">
            {itensMenu.map((item) => {
              const ativo = rotaAtiva(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!menuAberto ? item.nome : undefined}
                  className={`flex items-center rounded-xl py-3 transition ${
                    menuAberto
                      ? "gap-3 px-4"
                      : "justify-center px-2"
                  } ${
                    ativo
                      ? "bg-red-600 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <span className="text-lg">{item.icone}</span>

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
              title={!menuAberto ? "Configurações" : undefined}
              className={`flex items-center rounded-xl py-3 transition ${
                menuAberto
                  ? "gap-3 px-4"
                  : "justify-center px-2"
              } ${
                rotaAtiva("/configuracoes")
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <span className="text-lg">⚙</span>

              {menuAberto && (
                <span className="text-sm font-medium">
                  Configurações
                </span>
              )}
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur lg:hidden">
            <h1 className="text-xl font-bold text-red-600">
              FinControl
            </h1>

            <button
              type="button"
              onClick={() =>
                setMenuMobileAberto((aberto) => !aberto)
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700"
            >
              ☰
            </button>
          </header>

          {menuMobileAberto && (
            <div className="fixed inset-0 z-50 bg-black/80 lg:hidden">
              <aside className="h-full w-72 border-r border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <h2 className="text-xl font-bold text-red-600">
                    FinControl
                  </h2>

                  <button
                    type="button"
                    onClick={() => setMenuMobileAberto(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700"
                  >
                    ✕
                  </button>
                </div>

                <nav className="mt-5 space-y-2">
                  {itensMenu.map((item) => {
                    const ativo = rotaAtiva(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuMobileAberto(false)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                          ativo
                            ? "bg-red-600 text-white"
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        <span>{item.icone}</span>
                        <span>{item.nome}</span>
                      </Link>
                    );
                  })}

                  <Link
                    href="/configuracoes"
                    onClick={() => setMenuMobileAberto(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                      rotaAtiva("/configuracoes")
                        ? "bg-red-600 text-white"
                        : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    <span>⚙</span>
                    <span>Configurações</span>
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