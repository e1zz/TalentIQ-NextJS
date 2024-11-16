'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabase = createClientComponentClient()

function ConfirmationContent() {
  const [message, setMessage] = useState('Verifying your email...')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token')
      const type = searchParams.get('type')

      if (token && type === 'email') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email',
          })

          if (error) {
            setMessage('Error verifying your email. Please try again.')
          } else {
            setMessage('Email verified successfully!')
            // Redirect to sign in page after 2 seconds
            setTimeout(() => router.push('/auth/signin'), 2000)
          }
        } catch (error) {
          setMessage('An unexpected error occurred.')
        }
      } else {
        setMessage('Invalid verification link.')
      }
    }

    confirmEmail()
  }, [searchParams, router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
        <p>{message}</p>
      </div>
    </div>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
} 