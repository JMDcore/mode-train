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
    "PWA premium de entrenamiento para gym y running con rutinas, agenda semanal y resumen de progreso.",
  applicationName: "Mode Train",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mode Train",
    description:
      "Training companion oscura y precisa para gestionar rutinas, planificar la semana y registrar entrenos de gym y running.",
    type: "website",
    locale: "es_ES",
    siteName: "Mode Train",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mode Train",
    description:
      "Training PWA premium con rutinas, calendario interno y resumen visual de gym y running.",
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
      data-scroll-behavior="smooth"
      className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
