import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { ToastProvider } from "@/components/ui/toaster";

// ToastDisplay uses @radix-ui/react-toast which breaks SSR prerendering — client-only
const ToastDisplay = dynamic(
  () => import("@/components/ui/toaster").then((m) => m.ToastDisplay),
  { ssr: false }
);

export const metadata: Metadata = {
  title: "EduAdmin — Gestion de l'Institut",
  description: "Plateforme de gestion interne pour instituts d'éducation privés",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <ToastProvider>
          {children}
          <ToastDisplay />
        </ToastProvider>
      </body>
    </html>
  );
}
