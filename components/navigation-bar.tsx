"use client"

import Link from "next/link"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet"
import { Button } from "./ui/button"
import { Bell, Settings } from "lucide-react"
import { JSX, SVGProps } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

interface AuthorizedNavbarProps {
  onLogout: () => Promise<void>;
}

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleLogout() {
    try {
      await supabase.auth.signOut()
      router.push('/Auth/signIn')
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return user ? <AuthorizedNavbar onLogout={handleLogout} /> : <UnauthorizedNavbar />
}

function UnauthorizedNavbar() {
  return (
    <nav className="flex items-center justify-between px-4 py-5 pb-5 border-b-2">
      <Link href="/" className="flex items-center gap-2" prefetch={false}>
        <MountainIcon className="h-6 w-6" />
        <span className="text-lg font-semibold">TalentIQ</span>
      </Link>
      <div className="hidden md:flex gap-4">
        <Link 
          href="/Auth/signIn" 
          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Iniciar Sesión
        </Link>
        <Link 
          href="/Auth/signIn" 
          className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 hover:text-black transition-colors"
        >
          Registrarse
        </Link>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Abrir menú de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menú de Navegación</SheetTitle>
          </SheetHeader>
          <nav className="grid w-[200px] p-4">
            <Link href="/Auth/signIn" className="text-lg font-medium hover:underline underline-offset-4">
              Iniciar Sesión
            </Link>
            <Link href="/Auth/signIn" className="text-lg font-medium hover:underline underline-offset-4">
              Registrarse
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </nav>
  )
}

function AuthorizedNavbar({ onLogout }: AuthorizedNavbarProps) {
  return (
    <nav className="flex items-center justify-between px-4 py-5 pb-5 border-b-2">
      <Link href="#" className="flex items-center gap-2" prefetch={false}>
        <MountainIcon className="h-6 w-6" />
        <span className="text-lg font-semibold">TalentIQ</span>
      </Link>
      <div className="hidden md:flex gap-4">
        <Link href="#" className="group inline-flex w-max items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100 hover:text-gray-900" title="Configuración">
          <Settings />
        </Link>
        <Link href="#" className="group inline-flex w-max items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-gray-100 hover:text-gray-900" title="Notificaciones">
          <Bell />
        </Link>
        <Link href="#" className="w-max items-center justify-center rounded-md  px-4 py-2" prefetch={false}>
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>

        </Link>
        <button
          onClick={onLogout}
          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Abrir menú de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menú de Navegación</SheetTitle>
          </SheetHeader>
          <div className="grid w-[200px] p-4">
            <Link href="#" className="text-lg font-medium hover:underline underline-offset-4" prefetch={false}>
              Inicio
            </Link>
            <Link href="#" className="text-lg font-medium hover:underline underline-offset-4" prefetch={false}>
              Acerca de
            </Link>
            <Link href="#" className="text-lg font-medium hover:underline underline-offset-4" prefetch={false}>
              Servicios
            </Link>
            <Link href="#" className="text-lg font-medium hover:underline underline-offset-4" prefetch={false}>
              Portafolio
            </Link>
            <Link href="#" className="text-lg font-medium hover:underline underline-offset-4" prefetch={false}>
              Contacto
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}

function MenuIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}


function MountainIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  )
}
