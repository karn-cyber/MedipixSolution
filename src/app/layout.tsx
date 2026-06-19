import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { isClerkConfigured } from "@/lib/clerk-config";
import RegisterSW from "./register-sw";

export const metadata: Metadata = {
  title: "Medipix Invoices",
  description: "Medipix — employee invoice uploads & team visibility.",
  applicationName: "Medipix",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Medipix",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d4ed8",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const body = (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-slate-50 text-slate-900">
        <RegisterSW />
        {children}
      </body>
    </html>
  );

  // ClerkProvider requires a publishable key; only mount it when configured.
  return isClerkConfigured() ? <ClerkProvider>{body}</ClerkProvider> : body;
}
