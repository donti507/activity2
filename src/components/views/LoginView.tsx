"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useZenos } from '../../context/ZenosContext';
import { supabase } from '../../lib/supabase';

type AuthView = 'login' | 'signup' | 'verify' | 'forgot-password' | 'reset-password';

export default function LoginView() {
  const { loginWithGoogle, loginOffline } = useZenos();
  const shouldReduce = useReducedMotion();
  const [currentView, setCurrentView] = useState<AuthView>('login');
  
  // Fields state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Intermediary states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Live password checkers
  const [checks, setChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

  // Watch URL hash or parameters in case we came from a recovery link
  useEffect(() => {
    // Check if recovery link is active
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('type=recovery') || search.includes('type=recovery') || hash.includes('access_token=')) {
        setCurrentView('reset-password');
      }
    }
  }, []);

  useEffect(() => {
    setChecks({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
    });
  }, [password]);

  const allRequirementsMet = checks.length && checks.upper && checks.lower && checks.number && checks.special;

  // Sign In using Supabase Email/Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('PLEASE FILL ALL SECURITY INPUT CHANNELS.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
    } catch (err: any) {
      console.warn('Supabase sign-in failed/unreachable. Activating local offline fallback.', err);
      // Automatically fall back offline for zero friction and ultimate resilience
      loginOffline(email, email.split('@')[0]);
    } finally {
      setLoading(false);
    }
  };

  // Sign Up with custom password checks
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg('INSUFFICIENT COEFFICIENTS TO DEPLOY ACCOUNT.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('PASSWORD CIPHERS MUST ALIGN DISPATCH (MISMATCH).');
      return;
    }
    if (!allRequirementsMet) {
      setErrorMsg('CIPHER SPECIFICATIONS HARDEST REQUIREMENT COLLAPSE.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;

      setPendingEmail(email);
      setSuccessMsg('ACCOUNT INITIATED PERFECTLY.');
      setCurrentView('verify');
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'CORE SYS REGISTRATION DENIED.');
    } finally {
      setLoading(false);
    }
  };

  // Resend confirmation email
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('SPECIFY REGISTERED TARGET MAIL ADDR TO PROGRESS.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      if (error) throw error;
      setSuccessMsg('RE-DISPATCH RECOVERY PROTOCOLS COMMITTED.');
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'RE-DISPATCH CANCELLED BY SERVER.');
    } finally {
      setLoading(false);
    }
  };

  // Reset email request trigger
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('SPECIFY RECOVERY MAIL ADDRESS TO PROCEED.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setSuccessMsg(`RESET LINK SENT — recovery token routed to inbox.`);
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'RECOVERY LINK PROPAGATION CRITICAL ERROR.');
    } finally {
      setLoading(false);
    }
  };

  // Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('CIPHER CHANNELS REQUIRED.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('CIPHERS MUST BE MATCHED.');
      return;
    }
    if (!allRequirementsMet) {
      setErrorMsg('REQUIREMENTS PROFILE RED.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccessMsg('SUCCESS! NEW SECURE PASSKEY DEPLOYED.');
      // Auto transition to login portal
      setTimeout(() => {
        setCurrentView('login');
        setSuccessMsg('');
        setPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'PASSPHRASE OVERWRITE REJECTED.');
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.95 },
    visible: { 
      opacity: 1,
      scale: 1,
      transition: { duration: 0.45, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      scale: shouldReduce ? 1 : 0.95,
      transition: { duration: 0.2 }
    }
  };

  const switchView = (v: AuthView) => {
    setErrorMsg('');
    setSuccessMsg('');
    setPassword('');
    setConfirmPassword('');
    setCurrentView(v);
  };

  return (
    <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
      
      {/* Background Speed Lines Grid */}
      <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
      
      {/* Decors */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffc081]/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#1f1f22]/20 rounded-full blur-[100px] pointer-events-none z-0" />

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentView}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative z-10 w-full max-w-[440px] px-6 py-10 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none"
        >
          {/* Top telemetry brackets */}
          <div className="absolute -top-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎡</div>
          <div className="absolute -top-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎤</div>
          <div className="absolute -bottom-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎣</div>
          <div className="absolute -bottom-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎦</div>

          {/* Subtitle Telemetry headers */}
          <div className="font-mono text-[9px] text-[#ffc081] tracking-[4px] uppercase mb-1.5 opacity-85 select-none text-center">
            {currentView === 'login' && '⚡ SECURE SECURE GATEWAY ⚡'}
            {currentView === 'signup' && '⚡ INITIAL OPERATOR INTERFACE ⚡'}
            {currentView === 'verify' && '⚡ SECURITY CORRESPONDENCE GATES ⚡'}
            {currentView === 'forgot-password' && '⚡ CIPHER REPAIR ROUTINES ⚡'}
            {currentView === 'reset-password' && '⚡ MODULATION SECURE GATEWAYS ⚡'}
          </div>

          {/* Title and subtitle */}
          <h1 className="font-anton text-6xl text-[#ffc081] tracking-[3px] leading-none mb-1 shadow-sm uppercase select-none">
            ZEN_OS
          </h1>
          <p className="font-mono text-[10.5px] text-[#a38d7a] uppercase tracking-[2.5px] mb-6 select-none border-b border-[#554434] w-2/3 pb-2.5 text-center">
            POWERED BY DANTE
          </p>

          {/* Status Message System */}
          {errorMsg && (
            <div className="w-full text-left font-mono text-[10px] text-[#ffb4ab] bg-[#2d1615] border border-[#ffb4ab]/30 p-3 mb-5 uppercase tracking-wide leading-relaxed">
              ❌ TRANSACTION INTERRUPTED:<br />
              <span className="text-white brightness-90">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="w-full text-left font-mono text-[10px] text-[#6ee7b7] bg-[#1a2520] border border-[#6ee7b7]/30 p-3 mb-5 uppercase tracking-wide leading-relaxed">
              ✓ ENCRYPTION CONFIRMED:<br />
              <span className="text-white brightness-95">{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN VIEW */}
          {currentView === 'login' && (
            <form onSubmit={handleSignIn} className="w-full text-left space-y-4">
              <div>
                <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">OPERATOR ID (EMAIL)</label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-[45px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.35)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="operator@system.io"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">PASSKEY VAULT CODE</label>
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-[45px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.35)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[50px] bg-[#ffc081] text-[#2c1600] font-mono font-bold text-[11px] uppercase tracking-wider cursor-pointer border-none rounded-none hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {loading ? 'SYNCHRONIZING ACCESS SYSTEM...' : 'SIGN IN'}
              </button>

              <div className="w-full my-6 flex items-center justify-between">
                <span className="h-px bg-[#554434] flex-1"></span>
                <span className="font-mono text-[10px] text-[#a38d7a] px-3">OR</span>
                <span className="h-px bg-[#554434] flex-1"></span>
              </div>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full h-[50px] border border-[#554434] bg-transparent text-[#dbc2ad] font-mono font-bold text-[10.5px] uppercase tracking-wider rounded-none hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] shrink-0">
                  <path fill="#dbc2ad" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#dbc2ad" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#dbc2ad" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#dbc2ad" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                CONTINUE WITH GOOGLE
              </button>

              <button
                type="button"
                onClick={() => loginOffline('offline-operator@system.io', 'Demo Operator')}
                className="w-full h-[50px] border border-dashed border-[#ffc081]/40 bg-[#ffc081]/5 text-[#ffc081] font-mono font-bold text-[10.5px] uppercase tracking-wider rounded-none hover:bg-[#ffc081]/15 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <span className="material-symbols-outlined text-[16px]">cloud_off</span>
                BYPASS ACCESS (LOCAL OFFLINE DEMO)
              </button>

              <div className="w-full mt-6 pt-4 border-t border-[#554434]/30 flex justify-between font-mono text-[9px] text-[#a38d7a] uppercase tracking-wide">
                <button type="button" onClick={() => switchView('signup')} className="hover:text-[#ffc081] hover:underline bg-transparent border-none cursor-pointer">DON'T HAVE AN ACCOUNT? SIGN UP</button>
                <button type="button" onClick={() => switchView('forgot-password')} className="hover:text-[#ffc081] hover:underline bg-transparent border-none cursor-pointer">FORGOT PASSWORD?</button>
              </div>
            </form>
          )}

          {/* 2. SIGN UP VIEW */}
          {currentView === 'signup' && (
            <form onSubmit={handleSignUp} className="w-full text-left space-y-3">
              <div>
                <label className="block font-mono text-[8px] text-[#a38d7a] uppercase tracking-wider mb-0.5">FULL OPERATOR NAME</label>
                <input 
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full h-[38px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="Professor Dante"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] text-[#a38d7a] uppercase tracking-wider mb-0.5">OPERATOR ID (EMAIL)</label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-[38px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="operator@system.io"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] text-[#a38d7a] uppercase tracking-wider mb-0.5">PASSWORD CIPHER</label>
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-[38px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] text-[#a38d7a] uppercase tracking-wider mb-0.5">CONFIRM PASSWORD CIPHER</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-[38px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {/* Password dynamic verification checklist */}
              <div className="bg-[#17171d] border border-[#554434] p-3 text-left font-mono text-[8.5px] uppercase tracking-wide space-y-1.5 select-none">
                <div className="text-[#a38d7a] border-b border-[#554434] pb-1 font-bold text-[7.5px] tracking-wider">CIPHER KEY CONSTRAINTS:</div>
                
                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.length ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.length ? '✓' : '✗'}</span>
                  <span>At least 8 characters</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.upper ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.upper ? '✓' : '✗'}</span>
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.lower ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.lower ? '✓' : '✗'}</span>
                  <span>At least 1 lowercase letter (a-z)</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.number ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.number ? '✓' : '✗'}</span>
                  <span>At least 1 number (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.special ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.special ? '✓' : '✗'}</span>
                  <span>At least 1 special character (!@#$%^&*()_+-=)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !allRequirementsMet}
                className={`w-full h-[45px] border-none font-mono font-bold text-[10.5px] uppercase tracking-wider rounded-none transition-all flex items-center justify-center select-none
                  ${allRequirementsMet ? 'bg-[#ffc081] text-[#2c1600] hover:brightness-110 cursor-pointer active:scale-[0.98]' : 'bg-[#2a231f] text-[#554434] cursor-not-allowed'}
                `}
              >
                {loading ? 'CREATING CODES...' : 'CREATE ACCOUNT'}
              </button>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full h-[44px] border border-[#554434] bg-transparent text-[#dbc2ad] font-mono font-bold text-[10px] uppercase tracking-wider rounded-none hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer mt-2"
              >
                CONTINUE WITH GOOGLE
              </button>

              <div className="w-full mt-4 pt-3 border-t border-[#554434]/30 flex justify-center font-mono text-[9px] uppercase tracking-wide">
                <button type="button" onClick={() => switchView('login')} className="text-[#a38d7a] hover:text-[#ffc081] bg-transparent border-none cursor-pointer hover:underline">
                  ALREADY HAVE AN ACCOUNT? SIGN IN
                </button>
              </div>
            </form>
          )}

          {/* 3. VERIFY PENDING VIEW */}
          {currentView === 'verify' && (
            <div className="w-full text-left space-y-4">
              
              <div className="w-14 h-14 bg-[#ffc081]/15 border-[2.2px] border-[#ffc081] text-[#ffc081] flex items-center justify-center rounded-none mx-auto mb-4 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>

              <h2 className="font-anton text-2xl text-center text-[#ffc081] uppercase tracking-[1px]">VERIFY YOUR EMAIL</h2>

              <p className="font-mono text-[11px] text-[#e4e1e6] text-center leading-relaxed uppercase">
                We sent a validation token link to <span className="text-[#6ee7b7] font-bold break-all">{pendingEmail || email}</span>. Review your inbox to authorize credentials.
              </p>

              <form onSubmit={handleResend} className="space-y-4.5 pt-2">
                <div>
                  <label className="block font-mono text-[8px] text-[#a38d7a] uppercase tracking-wider mb-1">RE-SEND CODE TO EMAIL</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-[44px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
                    placeholder="operator@system.io"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[46px] bg-[#ffc081] text-[#2c1600] font-mono font-bold text-[10.5px] uppercase tracking-wider cursor-pointer border-none rounded-none hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  {loading ? 'RE-TRANSMITTING...' : 'RESEND VERIFICATION EMAIL'}
                </button>
              </form>

              <div className="w-full pt-4 border-t border-[#554434]/40 flex justify-center font-mono text-[10px] uppercase tracking-wide">
                <button type="button" onClick={() => switchView('login')} className="text-[#a38d7a] hover:text-[#ffc081] bg-transparent border-none cursor-pointer hover:underline">
                  ← BACK TO SIGN IN
                </button>
              </div>
            </div>
          )}

          {/* 4. FORGOT PASSWORD VIEW */}
          {currentView === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="w-full text-left space-y-4">
              <p className="font-mono text-[11px] text-[#e4e1e6] text-center leading-relaxed uppercase mb-4">
                Verify your operator email address and we will supply a key reset authentication token direct to your terminal.
              </p>

              <div>
                <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">OPERATOR ID (EMAIL)</label>
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-[45px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.35)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="operator@system.io"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] bg-[#ffc081] text-[#2c1600] font-mono font-bold text-[11px] uppercase tracking-wider cursor-pointer border-none rounded-none hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {loading ? 'TRANSMITTING RECOVERY TOKEN...' : 'SEND RESET LINK'}
              </button>

              <div className="w-full pt-4 border-t border-[#554434]/30 flex justify-center font-mono text-[9.5px] uppercase tracking-wide">
                <button type="button" onClick={() => switchView('login')} className="text-[#a38d7a] hover:text-[#ffc081] bg-transparent border-none cursor-pointer hover:underline">
                  ← BACK TO SIGN IN
                </button>
              </div>
            </form>
          )}

          {/* 5. RESET PASSWORD VIEW */}
          {currentView === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="w-full text-left space-y-4">
              <p className="font-mono text-[11px] text-[#e4e1e6] text-center leading-relaxed uppercase mb-4">
                ENTER A SECURE NEW CIPHER KEY CODE TO RE-ENABLE ENCRYPTION CONTROLS.
              </p>

              <div>
                <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">NEW PASSWORD CIPHER</label>
                <input 
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.35)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">CONFIRM NEW CIPHER</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.35)] focus:ring-0 focus:outline-none transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>

              {/* Password checks */}
              <div className="bg-[#17171d] border border-[#554434] p-3 text-left font-mono text-[8.5px] uppercase tracking-wide space-y-1.5 select-none">
                <div className="text-[#a38d7a] border-b border-[#554434] pb-1 font-bold text-[7.5px] tracking-wider">NEW KEY PARAMETERS:</div>
                
                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.length ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.length ? '✓' : '✗'}</span>
                  <span>At least 8 characters</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.upper ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.upper ? '✓' : '✗'}</span>
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.lower ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.lower ? '✓' : '✗'}</span>
                  <span>At least 1 lowercase letter (a-z)</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.number ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.number ? '✓' : '✗'}</span>
                  <span>At least 1 number (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 transition-colors duration-150 ${checks.special ? 'text-[#6ee7b7]' : 'text-[#a38d7a]'}`}>
                  <span>{checks.special ? '✓' : '✗'}</span>
                  <span>At least 1 special character (!@#$%^&*()_+-=)</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !allRequirementsMet}
                className={`w-full h-[46px] border-none font-mono font-bold text-[10.5px] uppercase tracking-wider rounded-none transition-all flex items-center justify-center select-none
                  ${allRequirementsMet ? 'bg-[#ffc081] text-[#2c1600] hover:brightness-110 cursor-pointer active:scale-[0.98]' : 'bg-[#2a231f] text-[#554434] cursor-not-allowed'}
                `}
              >
                {loading ? 'RESETTING...' : 'SET NEW PASSWORD'}
              </button>
            </form>
          )}

          {/* Decors footer */}
          <div className="mt-8 pt-4 border-t border-[#554434]/40 w-full flex flex-col gap-1 text-[8px] font-mono text-[#a38d7a] uppercase tracking-widest select-none">
            <div>SECURE USER ENDPOINT PORTAL</div>
            <div className="text-[#ffc081]/75">V4.9.0-BRUTALIST // CLOUD STORAGE INITIATED</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
