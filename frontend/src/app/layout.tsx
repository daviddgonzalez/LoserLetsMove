import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
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
  title: "Loser, Lets Move — Personalized Kinematic Evaluator",
  description:
    "AI-powered movement analysis that learns your body. Upload videos or stream live to get personalized form feedback using computer vision and neural networks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex" suppressHydrationWarning>
        <Navbar />
        <main className="flex-1 min-h-screen overflow-y-auto md:ml-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-16 md:pt-6">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
