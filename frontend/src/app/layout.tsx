import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
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
  title: "Go Seven - Premium Streetwear",
  description: "Elevate your style with Go Seven's exclusive collection of premium streetwear and fashion.",
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
            </CartProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
