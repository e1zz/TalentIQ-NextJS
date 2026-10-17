import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className='flex min-h-screen w-full items-center justify-center px-4 py-12'>
      <SignUp path='/sign-up' signInUrl='/sign-in' fallbackRedirectUrl='/dashboard' />
    </main>
  )
}
