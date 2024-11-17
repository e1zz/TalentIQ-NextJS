

import Footer from '@/components/footer'
import { Navbar } from '@/components/navigation-bar'

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
    </>
  )
}
