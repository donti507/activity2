// @ts-nocheck
"use client";

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function VerifyPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('PLEASE INPUT COMPROMISED EMAIL FIELD TO RE-DISPATCH.');
      return;
    }

    setLoading(true);
    setMsg('');
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`
        }
      });

      if (error) throw error;
      setMsg('RE-TRANSMISSION SUCCESSFUL. REVIEW YOUR INBOX.');
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'RE-DISPATCH REJECTED.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
      <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
      
      <div className="relative z-10 w-full max-w-[440px] px-6 py-12 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none">
        
        {/* Animated Pulsing Email Envelope Icon */}
        <div className="w-14 h-14 bg-[#ffc081]/10 border-[2px] border-[#ffc081] text-[#ffc081] flex items-center justify-center rounded-none mb-6 animate-pulse select-none">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="font-anton text-3xl text-[#ffc081] tracking-[2.5px] uppercase select-none mb-1 leading-tight">
          VERIFY YOUR EMAIL
        </h1>
        <p className="font-mono text-[9px] text-[#a38d7a] uppercase tracking-wider mb-6 pb-4 border-b border-[#554434]/50 w-2/3">
          SECURITY PROTOCOL VERIFICATION
        </p>

        <p className="font-mono text-[11px] text-[#e4e1e6] leading-relaxed uppercase mb-6">
          We sent a verification link to your designated inbox. Please review your email and authorize the transmission to activate your portal credentials.
        </p>

        {msg && (
          <div className="w-full text-left font-mono text-[10px] text-[#6ee7b7] bg-[#1a2520] border border-[#6ee7b7]/30 p-3 mb-5 uppercase tracking-wide">
            ✓ STATUS UPDATE:<br />
            <span>{msg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="w-full text-left font-mono text-[10px] text-[#ffb4ab] bg-[#2d1615] border border-[#ffb4ab]/30 p-3 mb-5 uppercase tracking-wide">
            ❌ GATES RESET FAILURE:<br />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleResend} className="w-full text-left space-y-4 mb-6">
          <div>
            <label className="block font-mono text-[8px] text-[#a38d7a] uppercase tracking-wider mb-1">RE-TRANSMIT TO TARGET EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="Enter your email to resend"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#ffc081] text-[#2c1600] border-none font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer rounded-none hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'RE-TRANSMITTING...' : 'RESEND VERIFICATION EMAIL'}
          </button>
        </form>

        <div className="w-full pt-4 border-t border-[#554434]/40 flex justify-center font-mono text-[9px] uppercase tracking-wide">
          <a href="/auth/login" className="text-[#a38d7a] hover:text-[#ffc081] transition-colors font-bold">
            ← BACK TO SIGN IN
          </a>
        </div>
      </div>
    </div>
  );
}
