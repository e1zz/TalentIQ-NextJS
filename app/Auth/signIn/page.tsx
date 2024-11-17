'use client'

import SignIn from "@/components/SignIn";

export default function Home() {
    return (
      <section className='relative min-h-screen flex items-center justify-center'>
        {/* Blurred background */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/1920/1080" 
            alt="Authentication wallpaper"
            className="w-full h-full object-cover blur-sm brightness-50"
          />
        </div>
        
        {/* Sign in container */}
        <div className='relative z-10 w-full max-w-[500px] px-4'>
            <SignIn onForgotPassword={() => {}} />
        </div>
      </section>
    )
  }
  