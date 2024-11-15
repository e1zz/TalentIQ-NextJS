import Footer from '@/components/footer'
import Header from '@/components/header'
import { Navbar } from '@/components/navigation-bar'


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
