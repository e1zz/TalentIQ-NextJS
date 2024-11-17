'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
  collapsed?: boolean
}

export default function LogoutButton({ collapsed = false }: LogoutButtonProps) {
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