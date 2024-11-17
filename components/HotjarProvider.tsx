'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    hj: any
    _hjSettings: any
  }
}

type HotjarProviderProps = {
  children: React.ReactNode
}

export function HotjarProvider({ children }: HotjarProviderProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {  // Check for browser environment
      (function(h: any,o: Document,t: string,j: string,a?: any,r?: any){
          h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
          h._hjSettings={hjid:5211028,hjsv:6};
          a=o.getElementsByTagName('head')[0];
          r=o.createElement('script');
          r.async=1;
          r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
          a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    }
  }, [])

  return <>{children}</>
}