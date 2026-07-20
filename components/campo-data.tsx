"use client";

import { useRef } from "react";

type CampoDataProps = {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  descricao?: string;
  disabled?: boolean;
};

export default function CampoData({
  id,
  label,
  value,
  onChange,
  required = false,
  descricao,
  disabled = false,
}: CampoDataProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function abrirCalendario() {
    const input = inputRef.current;

    if (!input || disabled) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.focus();
      input.click();
    }
  }

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm text-zinc-300"
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 pr-14 text-white outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-calendar-picker-indicator]:opacity-0"
        />

        <button
          type="button"
          onClick={abrirCalendario}
          disabled={disabled}
          aria-label={`Abrir calendário de ${label}`}
          title="Selecionar data"
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 3v3m10-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
            />
          </svg>
        </button>
      </div>

      {descricao && (
        <p className="mt-2 text-xs text-zinc-600">
          {descricao}
        </p>
      )}
    </div>
  );
}