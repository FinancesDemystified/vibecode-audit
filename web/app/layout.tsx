import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VibeCode Audit - Free Security Scanner',
  description: 'AI-powered security scanner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
