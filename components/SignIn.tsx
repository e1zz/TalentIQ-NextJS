'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/utils/supabase/client';
import { errorMessage } from '@/lib/utils';
import InputField from './InputField';
import Button from './Button';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

interface SignInProps {
  onForgotPassword: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

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

      toast.success('¡Sesión iniciada correctamente!');
      router.refresh();
      router.push('/dashboard');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success('¡Cuenta creada correctamente!');
      router.push('/dashboard');
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    if (!email) {
      setError('Ingresa tu correo electrónico para restablecer tu contraseña');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success('Se ha enviado un enlace a tu correo para restablecer tu contraseña');
    } catch (error) {
      setError(errorMessage(error));
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[365px]"
      >
        <form 
          onSubmit={isSignUp ? handleSignUp : handleSignIn} 
          className="flex overflow-hidden gap-3.5 relative flex-col items-center justify-center px-6 sm:px-10 py-12 sm:py-16 rounded-2xl border border-cyan-200 border-solid backdrop-blur-2xl w-full"
        >
          <img loading="lazy" src="https://quragxfempstkztmzwtk.supabase.co/storage/v1/object/sign/Images/Frame%202.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZXMvRnJhbWUgMi5zdmciLCJpYXQiOjE3MzE2NDAxOTYsImV4cCI6MTc2MzE3NjE5Nn0.8cVBojfcbHfMWEMoK-bkStHuOaAPwpE6kmm4m8TsrZQ&t=2024-11-15T03%3A09%3A56.437Z" className="object-cover absolute inset-0 size-full" alt="" />
          
          <motion.h1 
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-0 text-3xl sm:text-4xl font-bold text-center text-white"
          >
            {isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
          </motion.h1>
          
          {error && (
            <p id="auth-error" role="alert" className="z-0 w-full rounded-lg bg-red-950/80 px-3 py-2 text-sm font-medium text-red-300">
              {error}
            </p>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup-form' : 'signin-form'}
              initial={{ opacity: 0, x: isSignUp ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -100 : 100 }}
              className="flex flex-col items-center gap-3.5 w-full"
            >
              <div className="w-full space-y-3.5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-email" className="text-sm font-medium text-white">
                    Correo electrónico
                  </label>
                  <InputField
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nombre@empresa.com"
                    aria-describedby={error ? 'auth-error' : undefined}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="auth-password" className="text-sm font-medium text-white">
                    Contraseña
                  </label>
                  <InputField
                    id="auth-password"
                    type="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    aria-describedby={error ? 'auth-error' : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                  />
                </div>

                {isSignUp && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="auth-confirm-password" className="text-sm font-medium text-white">
                      Confirmar contraseña
                    </label>
                    <InputField
                      id="auth-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      aria-describedby={error ? 'auth-error' : undefined}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {!isSignUp && (
            <>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="z-0 mt-4 text-sky-500 hover:text-sky-400 transition-colors font-medium self-start"
              >
                ¿Olvidaste tu contraseña?
              </button>
              
              <label className="z-0 mt-4 mb-4 flex items-center gap-3 text-neutral-400 cursor-pointer hover:text-neutral-300 transition-colors font-medium self-start">
                <div className="relative inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div aria-hidden="true" className={`w-6 h-6 sm:w-5 sm:h-5 border-2 rounded-md peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-400 ${
                    rememberMe ? 'bg-sky-500 border-sky-500' : 'border-neutral-400'
                  } transition-colors`}>
                    {rememberMe && (
                      <Check className="w-6 h-6 sm:w-5 sm:h-5 text-white" strokeWidth={2.5} />
                    )}
                  </div>
                </div>
                Recordarme
              </label>
            </>
          )}

          <Button type="submit" disabled={loading}>
            {loading 
              ? (isSignUp ? 'Registrando...' : 'Iniciando sesión...') 
              : (isSignUp ? 'Registrarse' : 'Iniciar Sesión')}
          </Button>

          <div className="flex z-0 gap-1.5 items-start mt-4 text-xs text-center">
            <span className="text-white/80 font-medium">
              {isSignUp ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta?'}
            </span>
            <button 
              type="button" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }} 
              className="text-sky-500 hover:text-sky-400 transition-colors font-semibold"
            >
              {isSignUp ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </div>
          
        </form>
      </motion.div>
    </main>
  );
};

export default SignIn;  