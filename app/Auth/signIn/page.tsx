'use client'

import SignIn from "@/components/SignIn";

export default function Home() {
    return (
      <section className='relative min-h-screen flex items-center justify-center'>
        {/* Blurred background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="h-full w-full bg-auth-wallpaper bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url("/images/auth-wallpaper.jpg")',
              imageRendering: 'crisp-edges'
            }}
          >
            <img 
              src="https://picsum.photos/1920/1080" 
              alt="Authentication wallpaper"
              className="w-full h-full object-cover blur-sm brightness-50"
            />
          </div>
        </div>
        
        {/* Sign in container */}
        <div className='relative z-10 w-full max-w-[500px] px-4'>
            <SignIn onForgotPassword={() => {}} />
        </div>
      </section>
    )
  }
  