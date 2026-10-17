'use client'

import { useClerk } from '@clerk/nextjs'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  collapsed?: boolean
}

export default function LogoutButton({ collapsed = false }: LogoutButtonProps) {
  const { signOut } = useClerk()

  const handleLogout = async () => {
    try {
      await signOut({ redirectUrl: '/' })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div 
      onClick={handleLogout}
      className="
        flex 
        items-center 
        gap-2 
        px-4 
        py-2 
        text-gray-400 
        hover:text-white 
        hover:bg-gray-800 
        cursor-pointer 
        transition-colors
      "
    >
      <LogOut size={20} />
      {!collapsed && <span>Logout</span>}
    </div>
  )
} 