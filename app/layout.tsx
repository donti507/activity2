// @ts-nocheck
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'ZEN_OS — Brutalist Productivity Dashboard',
  description: 'A dark brutalist productivity dashboard with task organization and Google authentication integrations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-[#0d0d0f] text-[#ffffff] min-h-screen overflow-x-hidden antialiased selection:bg-[#ffc081] selection:text-[#2c1600]">
        {children}
      </body>
    </html>
  );
}
