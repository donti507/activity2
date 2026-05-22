// @ts-nocheck
"use client";

import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('PLEASE VALUE TARGET EMAIL FEED.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'PASSWORD DISPATCH CORRUPTED.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
      <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
      
      <div className="relative z-10 w-full max-w-[440px] px-6 py-12 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none">
        
        {/* Top telemetry brackets */}
        <div className="absolute -top-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎡</div>
        <div className="absolute -top-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎤</div>
        <div className="absolute -bottom-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎣</div>
        <div className="absolute -bottom-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎦</div>

        <div className="font-mono text-[9px] text-[#ffc081] tracking-[4px] uppercase mb-1.5 opacity-85 select-none text-center">
          ⚡ RESET SYSTEM PASSKEY ⚡
        </div>

        <h1 className="font-anton text-4xl text-[#ffc081] tracking-[2.5px] uppercase select-none mb-1 leading-tight">
          RECOVER ACCESS
        </h1>
        <p className="font-mono text-[9px] text-[#a38d7a] uppercase tracking-wider mb-8 pb-4 border-b border-[#554434]/50 w-2/3">
          SECURITY CONTROLS RESET
        </p>

        {success ? (
          <div className="w-full text-left font-mono uppercase space-y-4">
            <div className="text-[11px] text-[#6ee7b7] bg-[#1a2520] border border-[#6ee7b7]/30 p-4 leading-relaxed">
              ✓ RESET LINK SENT — We dispatched a secure access recovery token link to <span className="text-[#6ee7b7] font-bold break-all">{email}</span>. Click this token to program your new credentials.
            </div>
            
            <a 
              href="/auth/login" 
              className="block w-full py-3.5 bg-[#ffc081] text-[#2c1600] font-mono text-center font-bold text-[10.5px] uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all rounded-none"
            >
              Back to Sign In
            </a>
          </div>
        ) : (
          <form onSubmit={handleResetRequest} className="w-full text-left space-y-4">
            {errorMsg && (
              <div className="w-full text-left font-mono text-[10px] text-[#ffb4ab] bg-[#2d1615] border border-[#ffb4ab]/30 p-3 mb-2 uppercase tracking-wide">
                ❌ CORRUPTION DISCOVERED:<br />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1.5">RECOVERY TARGET EMAIL</label>
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
              className="w-full h-[46px] bg-[#ffc081] text-[#2c1600] border-none font-mono font-bold text-[11px] uppercase tracking-wider cursor-pointer rounded-none hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'TRANSMITTING RECOVERY PIN...' : 'SEND RESET LINK'}
            </button>

            <div className="w-full pt-4 border-t border-[#554434]/30 flex justify-center font-mono text-[9.5px] uppercase tracking-wider">
              <a href="/auth/login" className="text-[#a38d7a] hover:text-[#ffc081] transition-colors">
                ← BACK TO SIGN IN
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
