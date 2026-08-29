import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import SessionProvider from '@/components/session-provider'
import './globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: {
    default: "Math Practice — Adaptive Learning for Grades 1-5",
    template: "%s | Math Practice",
  },
  description:
    "Fun, adaptive math practice for grades 1-5. Timed drills, Vedic math tricks, mastery tracking, and a parent dashboard to monitor progress.",
  keywords: [
    "math practice",
    "adaptive learning",
    "grade 1 math",
    "grade 2 math",
    "grade 3 math",
    "grade 4 math",
    "grade 5 math",
    "Vedic math",
    "timed drills",
    "math for kids",
    "mastery tracking",
  ],
  authors: [{ name: "Math Practice" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Math Practice",
    title: "Math Practice — Adaptive Learning for Grades 1-5",
    description:
      "Fun, adaptive math practice with Vedic tricks, timed drills, and mastery tracking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Math Practice — Adaptive Learning for Grades 1-5",
    description:
      "Fun, adaptive math practice with Vedic tricks, timed drills, and mastery tracking.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to content
        </a>
        <main id="main-content">
          <SessionProvider>
            {children}
          </SessionProvider>
        </main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
