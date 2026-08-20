import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CompanyProvider } from "@/context/CompanyContext";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { ReduxProvider } from "@/components/providers/ReduxProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SEEKH AI — Personalized Learning Platform",
  description: "AI-powered personalized learning platform with skill assessments, custom roadmaps, and human mentor feedback loops.",
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
        <ReduxProvider>
          <CompanyProvider>
            <LenisProvider>{children}</LenisProvider>
          </CompanyProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

