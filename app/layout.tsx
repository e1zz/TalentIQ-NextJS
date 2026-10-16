import { cn } from '@/lib/utils'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Providers from '@/components/providers'
import { Playfair_Display } from 'next/font/google'
import { HotjarProvider } from '@/components/HotjarProvider'

import './globals.css'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900'
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900'
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: 'TalentIQ',
  description: 'AI-powered talent search for headhunters and recruiters'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='es' suppressHydrationWarning>
      <body
        className={cn(
          'flex min-h-screen flex-col',
          geistSans.variable,
          geistMono.variable,
          playfair.variable
        )}
      >
        <HotjarProvider>
          <Providers>{children}</Providers>
          <SpeedInsights />
          <Analytics />
        </HotjarProvider>
      </body>
    </html>
  )
}
