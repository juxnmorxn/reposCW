import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://repos-cw.vercel.app'),
  title: "Repos ISP - Reportes de Soporte Técnico",
  description: "Sistema de gestión de actividades diarias y reportes para Ingeniero de Soporte Técnico ISP",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/icon-192.png', type: 'image/png' },
      { url: '/logo-isp.png', type: 'image/png' },
    ],
    shortcut: ['/icon-192.png'],
    apple: ['/icon-192.png'],
  },
  openGraph: {
    title: "Repos ISP - Reportes de Soporte Técnico",
    description: "Sistema de gestión de actividades diarias y reportes para Ingeniero de Soporte Técnico ISP",
    siteName: "Repos ISP",
    images: [
      {
        url: '/logo-isp.png',
        width: 512,
        height: 512,
        alt: 'Repos ISP Logo',
      },
    ],
    locale: 'es_MX',
    type: 'website',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Repos ISP",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {/* Animated background blobs (only dark mode) */}
          <div className="dark-bg-pattern" aria-hidden="true" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
