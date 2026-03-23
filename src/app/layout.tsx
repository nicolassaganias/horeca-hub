import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HORECA HUB Barcelona",
  description: "Plataforma logística para HORECA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
