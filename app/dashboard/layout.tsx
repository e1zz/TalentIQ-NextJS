import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get('sidebar:state')?.value === 'true'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <DashboardSidebar />

      <SidebarInset>
        <section className='p-4 bg-black min-h-screen'>
          <SidebarTrigger />
          {children}
        </section>
      </SidebarInset>
    </SidebarProvider>
  )
}
