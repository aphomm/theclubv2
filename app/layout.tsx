import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600'] });

export const metadata: Metadata = {
  title: 'THE CLUB - Exclusive Music Industry Private Club',
  description: 'In CULTURE We TRUST. An exclusive membership platform for music industry professionals in Inglewood, CA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
