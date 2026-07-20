import { ReactNode } from "react";
import LayoutComMenu from "@/components/layout-com-menu";

type PainelLayoutProps = {
  children: ReactNode;
};

export default function PainelLayout({
  children,
}: PainelLayoutProps) {
  return <LayoutComMenu>{children}</LayoutComMenu>;
}