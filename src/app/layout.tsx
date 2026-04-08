import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://train.jmdcore.com"),
  title: {
    default: "Mode Train",
    template: "%s | Mode Train",
  },
  description:
    "PWA premium de entrenamiento con foco en gym, running y una capa social privada diseñada para compartir progreso real.",
  applicationName: "Mode Train",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mode Train",
    description:
      "Training companion oscura, precisa y social-first para registrar sesiones, cuidar tu progreso y compartir solo con tu circulo privado.",
    type: "website",
    locale: "es_ES",
    siteName: "Mode Train",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mode Train",
    description:
      "Training PWA premium con diseño oscuro, motion de alto nivel y progreso compartido con amistades privadas.",
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#090511",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
