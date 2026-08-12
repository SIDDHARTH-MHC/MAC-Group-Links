import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ChunkRecovery } from "@/components/layout/chunk-recovery";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MAC Group Links | Maharaja Agrasen College",
  description:
    "Find SEC, VAC, GE, DSE, AEC and Core course group links for Maharaja Agrasen College.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
      nosnippet: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <ChunkRecovery />
        {children}
      </body>
    </html>
  );
}
