import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CompanyProvider } from "@/context/CompanyContext";
import { LenisProvider } from "@/components/providers/LenisProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HUNTR AI — Autonomous Sales Intelligence Platform",
  description: "AI-powered sales engine for automated lead ingestion, enrichment, outreach, and demo scheduling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F2FA]">
        <CompanyProvider>
          <LenisProvider>{children}</LenisProvider>
        </CompanyProvider>
      </body>
    </html>
  );
}

