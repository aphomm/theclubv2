import './globals.css';
import type { Metadata } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { Toaster } from 'sonner';

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  style: ['normal', 'italic'],
  variable: '--font-archivo',
});
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'ICWT - In Culture We Trust',
  description: 'In Culture We Trust. An exclusive membership platform for music industry professionals in Inglewood, CA.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${archivo.variable} ${plexMono.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" theme="dark" />
      </body>
    </html>
  );
}
