import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Chess Quest — learn chess the fun way',
  description:
    'A joyful chess adventure for kids and adults: bite-size lessons, thousands of puzzles, and friendly AI opponents from total beginner to grandmaster.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="kid">
      <body className={`${nunito.variable} font-sans antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
