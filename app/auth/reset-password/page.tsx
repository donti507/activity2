// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live checker
  const [checks, setChecks] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false
  });

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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      setErrorMsg('PLEASE INPUT VERIFIED DATA.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('KEY CIPHERS MUST MATCH PRECISELY.');
      return;
    }

    if (!allRequirementsMet) {
      setErrorMsg('NEW CIPHER CHARACTERISTICS UNMET.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'PASSWORD PROGRAMMING INTERACTION FAILED.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
        <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
        
        <div className="relative z-10 w-full max-w-[430px] px-6 py-12 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none">
          <div className="w-12 h-12 bg-[#6ee7b7]/15 border border-[#6ee7b7] flex items-center justify-center rounded-none mb-4 text-[#6ee7b7]">
            <span className="font-mono text-xl">✓</span>
          </div>

          <h2 className="font-anton text-2xl text-[#ffc081] tracking-[2px] uppercase select-none mb-2">
            PASSWORD UPDATED
          </h2>
          <p className="font-mono text-[10px] text-[#a38d7a] uppercase tracking-wider mb-6">
            NEW SECURITY MATRIX COMMITTED
          </p>

          <p className="font-mono text-xs text-[#e4e1e6] bg-[#1a2520] border border-[#6ee7b7]/30 p-4 mb-6 leading-relaxed uppercase">
            Your secure cipher reset has completed successfully. You may now return to the login screen and insert your fresh credentials.
          </p>

          <a 
            href="/auth/login" 
            className="w-full py-3.5 bg-[#ffc081] text-[#2c1600] font-mono font-bold text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all text-center rounded-none"
          >
            RETURN TO SIGN IN
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
      {/* Background Decorative Accents */}
      <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffc081]/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-[440px] px-6 py-8 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none my-6">
        
        {/* Top telemetry brackets */}
        <div className="absolute -top-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎡</div>
        <div className="absolute -top-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎤</div>
        <div className="absolute -bottom-1 -left-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎣</div>
        <div className="absolute -bottom-1 -right-1 text-[13px] font-mono text-[#ffc081] font-bold px-1 select-none">⎦</div>

        <div className="font-mono text-[9px] text-[#ffc081] tracking-[4px] uppercase mb-1.5 opacity-85 select-none text-center">
          ⚡ RESET CODES DETECTED ⚡
        </div>

        <h1 className="font-anton text-4xl text-[#ffc081] tracking-[3px] leading-none mb-1 shadow-sm uppercase select-none">
          SET NEW CIPHER
        </h1>
        <p className="font-mono text-[10px] text-[#a38d7a] uppercase tracking-[2px] mb-6 select-none border-b border-[#554434] w-2/3 pb-2 text-center">
          RESET OPERATOR PASSKEY
        </p>

        {errorMsg && (
          <div className="w-full text-left font-mono text-[10px] text-[#ffb4ab] bg-[#2d1615] border border-[#ffb4ab]/30 p-3 mb-5 uppercase tracking-wide leading-relaxed">
            ❌ SYS MODIFICATION CONFLICT:<br />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="w-full text-left space-y-4">
          <div>
            <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1.5">NEW PASSWORD CIPHER</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1.5">CONFIRM PASSWORD CIPHER</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>

          {/* Verification Indicators */}
          <div className="bg-[#17171d] border border-[#554434] p-3 text-left font-mono text-[9px] uppercase tracking-wide space-y-1.5 select-none">
            <div className="text-[#a38d7a] border-b border-[#554434] pb-1 font-bold text-[8px] tracking-wider">NEW PASSKEY SPECIFICATIONS:</div>
            
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
            className={`w-full h-[46px] border-none font-mono font-bold text-[11px] uppercase tracking-wider rounded-none transition-all flex items-center justify-center gap-2 select-none
              ${allRequirementsMet ? 'bg-[#ffc081] text-[#2c1600] hover:brightness-110 cursor-pointer active:scale-[0.98]' : 'bg-[#2a231f] text-[#554434] cursor-not-allowed'}
            `}
          >
            {loading ? 'RESETTING SYSTEM ACCESS...' : 'SET NEW PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
}
