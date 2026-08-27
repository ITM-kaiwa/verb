import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Luyện tập chia động từ",
  description: "Ứng dụng luyện chia động từ tiếng Nhật (Minna no Nihongo + Irodori)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-sand-100 text-sand-800">{children}</body>
    </html>
  );
}
