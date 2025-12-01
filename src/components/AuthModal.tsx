'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSwitchMode: (mode: 'signin' | 'signup') => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

export default function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn(provider, { callbackUrl: '/editor' });
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Register new user
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create account');
        }

        // Sign in after successful registration
        const signInResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error('Account created but failed to sign in. Please try signing in.');
        }

        router.push('/editor');
        onClose();
      } else {
        // Sign in existing user
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Invalid email or password');
        }

        router.push('/editor');
        onClose();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(10, 10, 14, 0.9)' }}
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md overflow-hidden rounded-2xl"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-dark)',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.1)',
        }}
        variants={modalVariants}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          {/* Background glow */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: 'radial-gradient(ellipse at top, rgba(0, 240, 255, 0.3), transparent 70%)',
            }}
          />
          
          <div className="relative">
            {/* Logo */}
            <motion.div
              className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              }}
              animate={{
                boxShadow: [
                  '0 0 15px rgba(0, 240, 255, 0.3)',
                  '0 0 30px rgba(0, 240, 255, 0.5)',
                  '0 0 15px rgba(0, 240, 255, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                <ellipse cx="12" cy="12" rx="9" ry="4" stroke="white" strokeWidth="1.5" />
                <circle cx="12" cy="12" r="2" fill="white" />
              </svg>
            </motion.div>

            <h2
              className="text-2xl font-bold text-center mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p
              className="text-sm text-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              {isSignUp
                ? 'Start creating immersive virtual tours'
                : 'Sign in to continue to your workspace'}
            </p>
          </div>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-secondary)"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg text-sm"
              style={{
                backgroundColor: 'rgba(255, 0, 128, 0.1)',
                border: '1px solid var(--neon-pink)',
                color: 'var(--neon-pink)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            </motion.div>
          )}

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <motion.button
              type="button"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-dark)',
                color: 'var(--text-primary)',
              }}
              whileHover={{
                borderColor: 'var(--neon-blue)',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.15)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </motion.button>
            <motion.button
              type="button"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-dark)',
                color: 'var(--text-primary)',
              }}
              whileHover={{
                borderColor: 'var(--neon-blue)',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.15)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </motion.button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full"
                style={{ borderTop: '1px solid var(--border-dark)' }}
              />
            </div>
            <div className="relative flex justify-center">
              <span
                className="px-4 text-xs"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                }}
              >
                or continue with email
              </span>
            </div>
          </div>

          {/* Name field (signup only) */}
          {isSignUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <label
                className="block text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-dark)',
                  color: 'var(--text-primary)',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--neon-blue)';
                  e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-dark)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </motion.div>
          )}

          {/* Email field */}
          <div>
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-dark)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--neon-blue)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-dark)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Password field */}
          <div>
            <label
              className="block text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-secondary)' }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-all disabled:opacity-50"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-dark)',
                color: 'var(--text-primary)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--neon-blue)';
                e.target.style.boxShadow = '0 0 10px rgba(0, 240, 255, 0.2)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-dark)';
                e.target.style.boxShadow = 'none';
              }}
            />
            {isSignUp && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                Must be at least 6 characters
              </p>
            )}
          </div>

          {/* Forgot password (signin only) */}
          {!isSignUp && (
            <div className="text-right">
              <motion.button
                type="button"
                className="text-xs"
                style={{ color: 'var(--neon-blue)' }}
                whileHover={{ opacity: 0.8 }}
              >
                Forgot password?
              </motion.button>
            </div>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, var(--neon-blue), var(--neon-pink))',
              color: 'var(--bg-primary)',
            }}
            whileHover={!isLoading ? { boxShadow: '0 0 30px rgba(0, 240, 255, 0.5)', scale: 1.02 } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="w-4 h-4 border-2 rounded-full"
                  style={{
                    borderColor: 'transparent',
                    borderTopColor: 'var(--bg-primary)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                {isSignUp ? 'Creating account...' : 'Signing in...'}
              </>
            ) : (
              <>
                {isSignUp ? 'Create Account' : 'Sign In'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </motion.button>

          {/* Switch mode */}
          <p
            className="text-center text-sm mt-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <motion.button
              type="button"
              onClick={() => {
                setError(null);
                onSwitchMode(isSignUp ? 'signin' : 'signup');
              }}
              className="font-medium"
              style={{ color: 'var(--neon-blue)' }}
              whileHover={{ opacity: 0.8 }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </motion.button>
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
