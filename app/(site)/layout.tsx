import Footer from '@/components/footer'
import { Navbar } from '@/components/navigation-bar'
import Hotjar from '@hotjar/browser'
import { useEffect } from 'react'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TalentIQ',
}

export default function SiteLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    Hotjar.init(5211028, 6)
  }, [])

  return (
    <>
      <header><Navbar/></header>
      <main className='grow'>{children}</main>
      <Footer />
    </>
  )
}
