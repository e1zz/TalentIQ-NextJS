import Link from 'next/link'

import { BrandMark } from '@/components/landing/brand-mark'

export default function Footer() {
  return (
    <footer className='border-t border-border bg-card'>
      <div className='mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8'>
        <div className='flex flex-col gap-2'>
          <BrandMark />
          <p className='text-body text-muted-foreground'>The task-first HR workspace.</p>
        </div>
        <div className='flex flex-col gap-1 text-body text-muted-foreground md:items-end'>
          <p>&copy; {new Date().getFullYear()} TalentIQ. All rights reserved.</p>
          <p>
            Built by{' '}
            <Link
              target='_blank'
              rel='noopener noreferrer'
              className='font-semibold text-brand-fg hover:underline'
              href='https://www.instagram.com/__e1z_/'
            >
              Jorge Zazueta
            </Link>
          </p>
        </div>
      </div>
    </footer>
  )
}
