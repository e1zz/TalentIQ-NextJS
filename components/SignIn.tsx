'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import InputField from './InputField';
import Button from './Button';
import { useRouter } from 'next/navigation';

interface SignInProps {
  onForgotPassword?: () => void;
  onSignUp?: () => void;
}

const SignIn: React.FC<SignInProps> = ({ 
  onForgotPassword = () => {}, 
  onSignUp = () => {} 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.refresh();
      router.push('/dashboard'); // or wherever you want to redirect after login
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex overflow-hidden gap-5 justify-center items-center px-28 py-64 h-full text-xs max-md:px-5 max-md:py-24">
      <form onSubmit={handleSignIn} className="flex overflow-hidden gap-3.5 relative flex-col justify-center items-center self-stretch px-10 py-16 my-auto rounded-2xl border border-cyan-200 border-solid backdrop-blur-2xl min-w-[240px] w-[365px]">
        <img loading="lazy" src="https://quragxfempstkztmzwtk.supabase.co/storage/v1/object/sign/Images/Frame%202.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZXMvRnJhbWUgMi5zdmciLCJpYXQiOjE3MzE2NDAxOTYsImV4cCI6MTc2MzE3NjE5Nn0.8cVBojfcbHfMWEMoK-bkStHuOaAPwpE6kmm4m8TsrZQ&t=2024-11-15T03%3A09%3A56.437Z" className="object-cover absolute inset-0 size-full" alt="" />
        <h1 className="z-0 text-4xl font-bold text-center text-white">
          SignIn
        </h1>
        
        {error && (
          <div className="z-0 text-red-500 text-sm mb-4">
            {error}
          </div>
        )}

        <InputField
          type="email"
          placeholder="user123@talentiq.com"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          type="password"
          placeholder="******************"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <button
          type="button"
          onClick={onForgotPassword}
          className="z-0 mt-4 text-sky-500"
        >
          Forgot Password?
        </button>
        
        <label className="z-0 mt-4 text-neutral-400">
          <input type="checkbox" className="sr-only" />
          Remember me!
        </label>
        
        <Button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'LogIn'}
        </Button>
        
        <div className="flex z-0 gap-1.5 items-start mt-4 text-xs text-center">
          <span className="text-white">Not a member?</span>
          <button type="button" onClick={onSignUp} className="text-sky-500">
            SignUp now
          </button>
        </div>
        
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/bf91aeebd9a357e03b1c08f1010c95071f456b5e59defcb01f4b2d67e56f81aa?placeholderIfAbsent=true&apiKey=84bf64bdfc11488b9ba599f4ea6538e2"
          alt=""
          className="object-contain absolute z-0 self-start rounded aspect-[1.06] bottom-[177px] h-[18px] left-[47px] w-[19px]"
        />
      </form>
    </main>
  );
};

export default SignIn;