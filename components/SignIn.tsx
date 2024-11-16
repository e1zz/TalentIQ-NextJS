'use client';

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import InputField from './InputField';
import Button from './Button';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  const supabase = createClientComponentClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
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

      toast.success('¡Revisa tu correo para confirmar tu cuenta!');
      router.push('/Auth/signIn');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Por favor ingresa tu correo electrónico');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast.success('Se ha enviado un enlace a tu correo para restablecer tu contraseña');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <main className="flex overflow-hidden gap-5 justify-center items-center px-28 py-64 h-full text-xs max-md:px-5 max-md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <form 
          onSubmit={isSignUp ? handleSignUp : handleSignIn} 
          className="flex overflow-hidden gap-3.5 relative flex-col justify-center items-center self-stretch px-10 py-16 my-auto rounded-2xl border border-cyan-200 border-solid backdrop-blur-2xl min-w-[240px] w-[365px]"
        >
          <img loading="lazy" src="https://quragxfempstkztmzwtk.supabase.co/storage/v1/object/sign/Images/Frame%202.svg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJJbWFnZXMvRnJhbWUgMi5zdmciLCJpYXQiOjE3MzE2NDAxOTYsImV4cCI6MTc2MzE3NjE5Nn0.8cVBojfcbHfMWEMoK-bkStHuOaAPwpE6kmm4m8TsrZQ&t=2024-11-15T03%3A09%3A56.437Z" className="object-cover absolute inset-0 size-full" alt="" />
          
          <motion.h1 
            key={isSignUp ? 'signup' : 'signin'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-0 text-4xl font-bold text-center text-white"
          >
            {isSignUp ? 'Registrarse' : 'Iniciar Sesión'}
          </motion.h1>
          
          {error && (
            <div className="z-0 text-red-500 text-sm font-medium mb-4">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup-form' : 'signin-form'}
              initial={{ opacity: 0, x: isSignUp ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -100 : 100 }}
              className="flex flex-col gap-3.5 w-full"
            >
              <InputField
                type="email"
                placeholder="usuario123@talentiq.com"
                aria-label="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <InputField
                type="password"
                placeholder="******************"
                aria-label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              {isSignUp && (
                <InputField
                  type="password"
                  placeholder="Confirmar Contraseña"
                  aria-label="Confirmar Contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {!isSignUp && (
            <>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="z-0 mt-4 text-sky-500 hover:text-sky-400 transition-colors font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
              
              <label className="z-0 mt-4 flex items-center gap-2 text-neutral-400 cursor-pointer hover:text-neutral-300 transition-colors font-medium">
                <div className="relative inline-flex items-center">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`w-4 h-4 border rounded ${rememberMe ? 'bg-sky-500 border-sky-500' : 'border-neutral-400'} transition-colors`}>
                    {rememberMe && (
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
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