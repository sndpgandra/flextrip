import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'FlexiTrip - Multi-Generational Travel Planning',
  description: 'AI-powered travel planning that works for everyone in the family - from toddlers to grandparents.',
  keywords: ['travel planning', 'family travel', 'multi-generational', 'AI travel assistant'],
  authors: [{ name: 'FlexiTrip Team' }],
  creator: 'FlexiTrip',
  publisher: 'FlexiTrip',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/flexitrip-icon.svg', type: 'image/svg+xml', sizes: '32x32' },
    ],
    apple: [
      { url: '/flexitrip-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
  },
  openGraph: {
    title: 'FlexiTrip - Multi-Generational Travel Planning',
    description: 'AI-powered travel planning that works for everyone in the family',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/flexitrip-logo.svg',
        width: 1200,
        height: 630,
        alt: 'FlexiTrip Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlexiTrip - Multi-Generational Travel Planning',
    description: 'AI-powered travel planning that works for everyone in the family',
    images: ['/flexitrip-logo.svg'],
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5, // Allow zoom up to 500% for accessibility
  },
  manifest: '/manifest.json',
  themeColor: '#3B82F6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}