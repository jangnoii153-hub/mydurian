// src/app/layout.tsx
import type { Metadata } from "next";
import { Prompt, Kanit, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
});

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-kanit",
});

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "MyDurian - Smart Durian Farm Management",
  description: "ระบบจัดการสวนทุเรียนอัจฉริยะ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body
        className={`${prompt.variable} ${kanit.variable} ${notoSansThai.variable} font-noto min-h-screen bg-gradient-to-b from-gray-900 to-black antialiased`}
      >
        {/* ไม่มี Navbar/Footer ที่นี่ - ให้แต่ละหน้าจัดการเอง */}
        {children}
      </body>
    </html>
  );
}
