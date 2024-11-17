'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    _mouseflow: any[]
  }
}

export default function Mouseflow() {
  useEffect(() => {
    window._mouseflow = window._mouseflow || []
    window._mouseflow.push(['init', '719a824c-af66-48dd-9b92-7d64aa1e7e25'])
    
    const script = document.createElement('script')
    script.async = true
    script.src = '//cdn.mouseflow.com/projects/719a824c-af66-48dd-9b92-7d64aa1e7e25.js'
    document.head.appendChild(script)
  }, [])

  return null
} 