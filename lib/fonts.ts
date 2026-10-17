import { Open_Sans } from 'next/font/google'

/**
 * Open Sans - the typeface used throughout the Figma redesign
 * (Title/Page, Title/Card, Body, Meta text styles).
 *
 * Exposes the CSS variable `--font-open-sans`, which `--font-sans` in
 * app/globals.css resolves first. Apply `openSans.variable` on <body> in
 * app/layout.tsx to make it global; the app shell also applies it locally.
 */
export const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
  display: 'swap',
  weight: ['400', '600', '700']
})
