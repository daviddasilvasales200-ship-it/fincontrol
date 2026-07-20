import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinControl",
  description: "Controle seus gastos mensais de forma simples e inteligente.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}