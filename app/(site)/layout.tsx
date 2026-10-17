import type { Metadata } from 'next'

import { cn } from '@/lib/utils'
import { openSans } from '@/lib/fonts'
import Footer from '@/components/footer'
import { SiteHeader } from '@/components/landing/site-header'

export const metadata: Metadata = {
  title: 'TalentIQ · The HR Specialist workspace',
  description: 'A calmer, task-first HR platform: what needs you today first, then the full picture.'
}

export default function SiteLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={cn(openSans.variable, 'flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased')}>
      <a
        href='#main-content'
        className='sr-only rounded-sm bg-primary px-4 py-2.5 text-body font-semibold text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60]'
      >
        Skip to main content
      </a>
      <SiteHeader />
      <main id='main-content' tabIndex={-1} className='grow focus:outline-none'>
        {children}
      </main>
      <Footer />
    </div>
  )
}
