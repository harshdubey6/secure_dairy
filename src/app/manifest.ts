import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Secure Journal",
    short_name: "Journal",
    description: "Your private diary, beautifully crafted.",
    start_url: "/journal",
    display: "standalone",
    background_color: "#f5f0e8",
    theme_color: "#8b6914",
    orientation: "portrait",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { src: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
