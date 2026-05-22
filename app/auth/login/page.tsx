// @ts-nocheck
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('PLEASE INITIALIZE EMAIL AND PASSWORD FIELD.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/');
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'SIGN-IN INTERACTION FAILED.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'GOOGLE AUTH SERVICE OFFLINE.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
      {/* Background Decorative Accents */}
      <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffc081]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[430px] px-6 py-12 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none">
        {/* Top telemetry brackets */}
        <div className="absolute -top-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎡</div>
        <div className="absolute -top-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎤</div>
        <div className="absolute -bottom-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎣</div>
        <div className="absolute -bottom-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎦</div>

        <div className="font-mono text-[9px] text-[#ffc081] tracking-[4px] uppercase mb-1.5 opacity-85 select-none text-center">
          ⚡ SECURE SYSTEM GATES ⚡
        </div>

        {/* ZEN_OS logo & subtitle */}
        <h1 className="font-anton text-6xl text-[#ffc081] tracking-[3px] leading-none mb-1 shadow-sm uppercase select-none">
          ZEN_OS
        </h1>
        <p className="font-mono text-[10px] text-[#a38d7a] uppercase tracking-[2px] mb-8 select-none border-b border-[#554434] w-2/3 pb-3 text-center">
          POWERED BY DANTE
        </p>

        {errorMsg && (
          <div className="w-full text-left font-mono text-[10px] text-[#ffb4ab] bg-[#2d1615] border border-[#ffb4ab]/30 p-3 mb-6 uppercase tracking-wide leading-relaxed">
            ❌ SYSTEM BREACH LEVEL 1:<br />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignIn} className="w-full text-left space-y-4">
          <div>
            <label className="block font-mono text-[9px] text-[#a38d7a] uppercase tracking-wider mb-1.5">EMAIL OPERATOR ID</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-[46px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="operator@system.io"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[9px] text-[#a38d7a] uppercase tracking-wider mb-1.5">PASSWORD KEY</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-[46px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[48px] bg-[#ffc081] text-[#2c1600] border-none font-mono font-bold text-[11px] uppercase tracking-wider cursor-pointer rounded-none hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'SYNCHRONIZING SECURE KEY...' : 'SIGN IN'}
          </button>
        </form>

        <div className="w-full my-6 flex items-center justify-between">
          <span className="h-px bg-[#554434] flex-1"></span>
          <span className="font-mono text-[10px] text-[#a38d7a] px-3">OR</span>
          <span className="h-px bg-[#554434] flex-1"></span>
        </div>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full h-[48px] border border-[#554434] bg-transparent text-[#dbc2ad] font-mono font-bold text-[11px] uppercase tracking-wider rounded-none hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[18px] h-[18px] shrink-0">
            <path fill="#dbc2ad" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#dbc2ad" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#dbc2ad" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#dbc2ad" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        {/* Router redirects */}
        <div className="w-full mt-8 pt-4 border-t border-[#554434]/40 flex justify-between font-mono text-[9px] text-[#a38d7a] uppercase tracking-wide">
          <a href="/auth/signup" className="hover:text-[#ffc081] transition-colors">DON'T HAVE AN ACCOUNT? SIGN UP</a>
          <a href="/auth/forgot-password" className="hover:text-[#ffc081] transition-colors">FORGOT PASSWORD?</a>
        </div>
      </div>
    </div>
  );
}
