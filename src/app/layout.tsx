import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#8b6914",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Secure Journal — Your private diary",
  description: "A beautiful, secure, distraction-free personal journal.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: "/icon-192.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <ServiceWorkerRegister />
          {children}
        </Providers>
      </body>
    </html>
  );
}
