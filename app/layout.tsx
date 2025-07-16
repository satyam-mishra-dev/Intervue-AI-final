import { Toaster } from "sonner";
import type { Metadata } from "next";
import { Mona_Sans } from "next/font/google";

import "./globals.css";
import CookieClearer from "@/components/CookieClearer";

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
        {children}

        <Toaster />
      </body>
    </html>
  );
}
