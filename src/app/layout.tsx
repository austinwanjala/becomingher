import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Becoming Her | Digital Personal Development & Coaching Sanctuary for Women",
  description: "A digital personal development platform helping women access structured coaching programmes, AI-guided mentorship, and private 1-on-1 sessions. Founded by Zipporah Karanja.",
  keywords: ["women coaching", "personal development", "becoming her", "zipporah karanja", "life coaching kenya", "digital coaching programme"],
  openGraph: {
    title: "Becoming Her | Digital Sanctuary for Women",
    description: "Become the woman you are becoming through structured digital coaching and private mentorship.",
    url: "https://becomingher.co.ke",
    siteName: "Becoming Her",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
