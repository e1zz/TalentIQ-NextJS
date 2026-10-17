'use client'

import { useEffect } from 'react'
import Hotjar from '@hotjar/browser'

const HOTJAR_SITE_ID = 5211028
const HOTJAR_VERSION = 6

type HotjarProviderProps = {
  children: React.ReactNode
}

export function HotjarProvider({ children }: HotjarProviderProps) {
  useEffect(() => {
    Hotjar.init(HOTJAR_SITE_ID, HOTJAR_VERSION)
  }, [])

  return <>{children}</>
}
