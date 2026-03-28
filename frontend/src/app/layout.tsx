import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppContactButton from "@/components/WhatsAppContactButton";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import ClientCursor from "@/components/ClientCursor";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Go Seven - Premium Outfits & Embroideries",
  description: "Discover premium outfits and premium embroideries crafted with refined detailing, elevated texture, and luxury finish.",
  icons: {
    icon: [
      { url: "/go7-browser-icon.png", type: "image/png", sizes: "1024x1024" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased cursor-none`}>
        <ClientCursor />
        <AuthProvider>
          <SettingsProvider>
            <CartProvider>
              <Suspense fallback={null}>
                <Navbar />
              </Suspense>
              <Suspense fallback={null}>
                <WhatsAppContactButton />
              </Suspense>
              <main className="min-h-screen text-white">{children}</main>
              <SiteFooter />
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
