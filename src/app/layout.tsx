import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Эрдэнэсийн эрэл | BJTU Монгол Оюутны Холбоо',
  description: 'Бээжин хотын Хайдян паркт зохион байгуулагдаж буй орьентацийн бодит цагийн эрдэнэсийн эрэл тоглоом',
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
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased flex flex-col selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
