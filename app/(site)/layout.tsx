import Footer from '@/components/footer'
import Header from '@/components/header'
import { Navbar } from '@/components/navigation-bar'
import { SpeedInsights } from "@vercel/speed-insights/next"


import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TalentIQ',
}

export default function SiteLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header><Navbar/></header>
      <main className='grow'>{children}</main>
      <Footer />
      <SpeedInsights />
    </>
  )
}
