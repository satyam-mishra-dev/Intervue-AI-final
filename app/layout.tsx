import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";

import "./globals.css";
import CookieClearer from "@/components/CookieClearer";
import { GuestModeProvider } from "@/components/GuestModeProvider";
import DebugPanel from "@/components/DebugPanel";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InterVue AI",
  description: "An AI-powered platform for preparing for mock interviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${monaSans.className} antialiased pattern`}>
        <CookieClearer />
        <GuestModeProvider>
          {children}
        </GuestModeProvider>
        <DebugPanel />
        <Toaster />
      </body>
    </html>
  );
}
