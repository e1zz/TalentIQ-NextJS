'use client'

import { useState } from 'react'
import DashboardSidebar from '@/components/dashboard/dashboard-sidebar'

export default function DashboardLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  return (
    <div className="flex min-h-screen bg-[#141519]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Saltar al contenido
      </a>
      <DashboardSidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
      />

      <main id="main-content" tabIndex={-1} className={`
        flex-1
        w-full
        transition-all duration-300
        ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
      `}>
        <div className="
          min-h-screen 
          w-full 
          px-4 
          py-6 
          md:p-8 
          flex 
          flex-col 
          items-center 
          justify-center
          overflow-x-hidden
          max-w-7xl 
          mx-auto
        ">
          {/* Optional Header */}
          <div className="w-full mb-6">
            {/* Header content */}
          </div>

          {/* Main Content */}
          <div className="
            w-full 
            max-w-full 
            overflow-x-auto
            scrollbar-thin 
            scrollbar-thumb-gray-700 
            scrollbar-track-transparent
          ">
            {children}
          </div>

          {/* Optional Footer */}
          <div className="w-full mt-6">
            {/* Footer content */}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatsCard({ label, value, trend }: { label: string, value: string, trend?: string }) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-400">{label}</div>
      <div className="text-xl font-semibold text-white flex items-center gap-1">
        {value}
        {trend && <span className="text-sm text-green-400">{trend}</span>}
      </div>
    </div>
  )
}
