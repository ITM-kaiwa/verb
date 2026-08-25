import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "動詞活用練習",
  description: "みんなの日本語・いろどり 一般動詞の活用練習アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-sand-100 text-sand-800">{children}</body>
    </html>
  );
}
