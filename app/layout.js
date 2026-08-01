import './globals.css';

export const metadata = {
  title: '英単語フラッシュカード',
  description: '日本語↔英語の単語を覚えるフラッシュカードアプリ',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
