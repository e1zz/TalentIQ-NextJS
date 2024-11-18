'use client'

import { Sidebar, Menu, MenuItem, SubMenu } from 'react-pro-sidebar'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Search,
  Flag,
  Bot,
  Settings,
  UserSearch,
  Briefcase,
  Calendar,
  Files,
  Home,
  Menu as MenuIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOut,
} from 'lucide-react'
import LogoutButton from '../auth/logout-button'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface DashboardSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ collapsed, setCollapsed }) => {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Add this function to check if device is in mobile landscape mode
  const isMobileLandscape = () => {
    return window.matchMedia('(max-height: 768px) and (orientation: landscape)').matches
  }

  return (
    <>
      {/* Mobile Menu Button (below MD only) */}
      <button 
        className="
          fixed 
          top-4 
          left-4 
          z-50 
          p-2 
          bg-gray-800 
          rounded-md 
          md:hidden
          hover:bg-gray-700
          transition-colors
        "
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle Menu"
      >
        <MenuIcon className="h-6 w-6 text-gray-200" />
      </button>

      {/* Chevron Trigger for MD and up (both portrait and landscape) */}
      <div
        className={`
          hidden
          md:block
          fixed
          top-1/2
          -translate-y-1/2
          z-50
          transition-all
          duration-300
          ${collapsed ? 'left-20' : 'left-[250px]'}
        `}
      >
        <button
          className="
            flex
            items-center
            justify-center
            h-20
            w-6
            bg-gray-800
            hover:bg-gray-700
            transition-colors
            rounded-r-md
            cursor-pointer
          "
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRightIcon className="h-4 w-4 text-gray-200" />
          ) : (
            <ChevronLeftIcon className="h-4 w-4 text-gray-200" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={collapsed}
        toggled={!collapsed}
        onBackdropClick={() => setCollapsed(true)}
        breakPoint="md"
        backgroundColor="#1a1f2e"
        style={{ 
          height: '100%',
          borderRight: '2px solid #1f2937',
          position: 'fixed',
          zIndex: 40,
        }}
        rootStyles={{
          color: '#9ca3af',
        }}
      >
        {/* Back to Dashboard Link */}
        <div className="p-4 border-b border-gray-800 flex justify-center">
          <Link 
            href="/dashboard"
            className="text-gray-200 hover:text-white transition-colors"
          >
            <Home className="h-6 w-6" />
          </Link>
        </div>

        <div className="pt-5">
          <Menu
            menuItemStyles={{
              button: ({ level, active }) => ({
                backgroundColor: active ? '#1f2937' : 'transparent',
                color: active ? '#ffffff' : '#9ca3af',
                '&:hover': {
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                },
                // Center icons in collapsed state
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-start',
                alignItems: 'center',
                padding: collapsed ? '8px 0' : '8px 16px',
              }),
              icon: {
                // Ensure icons are centered when collapsed
                margin: collapsed ? '0 auto' : '0 8px 0 0',
                fontSize: '20px',
              },
            }}
          >
            <div className={collapsed ? 'px-2' : 'px-4'}>
              <MenuItem
                active={pathname === '/dashboard'}
                icon={<LayoutDashboard size={20} />}
                component={<Link href="/dashboard" />}
              >
                {!collapsed && 'Dashboard'}
              </MenuItem>
            </div>

            <div className={collapsed ? 'px-2' : 'px-4'}>
              <MenuItem
                active={pathname === '/dashboard/talentHunt'}
                icon={<UserSearch size={20} />}
                component={<Link href="/dashboard/talentHunt" />}
              >
                {!collapsed && 'Talent Hunt'}
              </MenuItem>
            </div>

            <div className={collapsed ? 'px-2' : 'px-4'}>
              <MenuItem
                active={pathname === '/dashboard/jobs'}
                icon={<Briefcase size={20} className="opacity-50" />}
                component={<Link href="/dashboard/jobs" />}
                disabled={true}
              >
                {!collapsed && <span className="opacity-50">Jobs</span>}
              </MenuItem>
            </div>

            <div className={collapsed ? 'px-2' : 'px-4'}>
              <MenuItem
                active={pathname === '/dashboard/Assistant'}
                icon={<Bot size={20} />}
                component={<Link href="/dashboard/Assistant" />}
              >
                {!collapsed && 'Assistant'}
              </MenuItem>
            </div>

            <div className={collapsed ? 'px-2' : 'px-4'}>
              <MenuItem
                active={pathname === '/dashboard/files'}
                icon={<Files size={20} />}
                component={<Link href="/dashboard/files" />}
              >
                {!collapsed && 'Files'}
              </MenuItem>
            </div>
          </Menu>
        </div>

        <div className="mt-auto border-t border-gray-800">
          <Menu
            menuItemStyles={{
              button: ({ level, active }) => ({
                backgroundColor: 'transparent',
                color: '#9ca3af',
                '&:hover': {
                  backgroundColor: '#1f2937',
                  color: '#ffffff',
                },
                display: 'flex',
                justifyContent: collapsed ? 'center' : 'flex-start',
                alignItems: 'center',
                padding: collapsed ? '8px 0' : '8px 16px',
              }),
              icon: {
                margin: collapsed ? '0 auto' : '0 8px 0 0',
                fontSize: '20px',
              },
            }}
          >
            <div className={collapsed ? 'px-2' : 'px-4'}>
              <MenuItem
                icon={<LogOut size={20} />}
                onClick={handleLogout}
              >
                {!collapsed && 'Logout'}
              </MenuItem>
            </div>
          </Menu>
        </div>
      </Sidebar>

      {/* Backdrop */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden portrait:block landscape:hidden max-h-[768px]:landscape:block"
          onClick={() => setCollapsed(true)}
        />
      )}
    </>
  )
}

export default DashboardSidebar
