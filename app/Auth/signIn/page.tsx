'use client'

import SignIn from "@/components/SignIn";

export default function Home() {
    return (
      <section className='flex flex-row overflow-hidden h-screen'>
        <div className='container'>
            <SignIn onForgotPassword={() => {}} />
        </div>
        <div className="wallpaper">
          <img 
            src="https://picsum.photos/1920/1080" 
            alt="Authentication wallpaper"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
      </section>
    )
  }
  