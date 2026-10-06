import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' });

export const metadata = { title: 'EbenchCampus Platform' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <QueryProvider><AuthProvider>{children}</AuthProvider></QueryProvider>
      </body>
    </html>
  );
}