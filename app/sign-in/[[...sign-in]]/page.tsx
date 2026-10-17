import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main className='flex min-h-screen w-full items-center justify-center px-4 py-12'>
      <SignIn path='/sign-in' signUpUrl='/sign-up' fallbackRedirectUrl='/dashboard' />
    </main>
  )
}
