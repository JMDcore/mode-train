import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mode Train",
    short_name: "ModeTrain",
    description:
      "PWA premium para entrenamiento, running y progreso compartido con amistades privadas.",
    start_url: "/",
    display: "standalone",
    background_color: "#08050f",
    theme_color: "#0b0714",
    lang: "es-ES",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
