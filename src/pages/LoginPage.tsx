/**
 * Login Page Component
 * 
 * Provides user authentication UI with email/password login and sign up.
 */

import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from '../components/ThemeToggle';
import './LoginPage.css';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, signOut, error: authError, user, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setIsSubmitting(false);
  };

  // Redirect if user is logged in and reset submitting state
  useEffect(() => {
    console.log('LoginPage useEffect - user:', user?.id, 'loading:', loading);
    if (!loading && user) {
      console.log('Redirecting to /org-setup');
      setIsSubmitting(false);
      navigate('/org-setup');
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    // Validation
    if (!email || !password) {
      setLocalError('Please fill in all required fields');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          setLocalError(error.message);
          setIsSubmitting(false);
          return;
        }
        // Check if user was auto-logged in (Supabase may auto-login after signup)
        // Wait a moment for auth state to update in useAuth hook
        await new Promise(resolve => setTimeout(resolve, 200));
        const { data: { user: signedUpUser } } = await supabase.auth.getUser();
        if (signedUpUser) {
          // User was auto-logged in, useEffect will handle redirect
          // Just reset submitting state
          setIsSubmitting(false);
          return;
        }
        // User needs to verify email first
        alert('Sign up successful! Please check your email to verify your account.');
        setIsSignUp(false);
        setPassword('');
        setConfirmPassword('');
        setIsSubmitting(false);
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setLocalError(error.message);
          setIsSubmitting(false);
          return;
        }
        // On successful sign in, redirect will happen via useEffect
        // But reset submitting state in case redirect is delayed
        setIsSubmitting(false);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="login-page">
      {user && (
        <div className="login-logout">
          <button
            type="button"
            onClick={handleLogout}
            className="logout-button"
            disabled={isSubmitting}
          >
            Sign Out
          </button>
        </div>
      )}
      <div className="login-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Your Native Tongue</h1>
          <p className="login-subtitle">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {displayError && (
            <div className="login-error" role="alert">
              {displayError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={isSubmitting}
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                autoComplete="new-password"
                disabled={isSubmitting}
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Please wait...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setLocalError(null);
              setPassword('');
              setConfirmPassword('');
            }}
            className="login-toggle"
            disabled={isSubmitting}
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}

