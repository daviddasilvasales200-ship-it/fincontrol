"use client";

import {
  ReactNode,
  useEffect,
} from "react";

type ModalInvestimentoProps = {
  aberto: boolean;
  titulo?: string;
  children: ReactNode;
  onFechar: () => void;
};

export default function ModalInvestimento({
  aberto,
  titulo = "Investimento",
  children,
  onFechar,
}: ModalInvestimentoProps) {
  useEffect(() => {
    if (!aberto) {
      return;
    }

    function fecharComEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        onFechar();
      }
    }

    const overflowAnterior =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      fecharComEscape
    );

    return () => {
      document.body.style.overflow =
        overflowAnterior;

      window.removeEventListener(
        "keydown",
        fecharComEscape
      );
    };
  }, [aberto, onFechar]);

  if (!aberto) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={onFechar}
    >
      <div
        className="relative max-h-[95vh] w-full overflow-y-auto rounded-t-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 sm:max-w-2xl sm:rounded-3xl"
        onMouseDown={(event) => {
          event.stopPropagation();
        }}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">
              FinControl
            </p>

            <h2 className="mt-1 text-lg font-bold text-white">
              {titulo}
            </h2>
          </div>

          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar modal"
            title="Fechar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700 text-lg text-zinc-400 transition hover:border-red-600 hover:bg-red-950/30 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-600/40"
          >
            ✕
          </button>
        </header>

        <div className="p-5 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}