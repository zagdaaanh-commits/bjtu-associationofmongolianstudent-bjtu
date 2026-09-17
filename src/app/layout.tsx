import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Эрдэнэсийн эрэл | BJTU Монгол Оюутны Холбоо',
  description:
    'Бээжин хотын Хайдян паркт зохион байгуулагдаж буй 64-bit ретро далайн дээрэмчний эрдэнэсийн эрэл тоглоом',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Эрдэнэсийн эрэл',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="mn" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Rubik:wght@600;700;800;900&family=Unbounded:wght@700;800;900&display=swap&subset=cyrillic,cyrillic-ext,latin"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#140b06] text-[#f4ebd0] min-h-screen antialiased flex flex-col selection:bg-amber-500 selection:text-black font-sans">
        {children}
      </body>
    </html>
  );
}
