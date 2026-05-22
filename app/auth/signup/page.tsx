// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function SignupPage() {
  const router = useRouter();
  
  // Fields state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Interaction state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Live Password checker states
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
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setErrorMsg('PLEASE FILL ALL INSTRUCTIONS.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('PASSWORDS MUST DISPATCH IN SYNC (DO NOT MATCH).');
      return;
    }

    if (!allRequirementsMet) {
      setErrorMsg('KEY SPECIFICATIONS UNMET.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/login`
        }
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message?.toUpperCase() || 'SYS CREATION PROCESS COLLAPSED.');
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

  if (success) {
    return (
      <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-sans p-4">
        <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
        
        <div className="relative z-10 w-full max-w-[430px] px-6 py-12 flex flex-col items-center bg-[#131316] border-[2px] border-[#554434] shadow-[12px_12px_0px_0px_#111] text-center rounded-none">
          <div className="w-12 h-12 bg-[#6ee7b7]/15 border border-[#6ee7b7] flex items-center justify-center rounded-none mb-4 text-[#6ee7b7]">
            <span className="font-mono text-xl">✓</span>
          </div>

          <h2 className="font-anton text-2xl text-[#ffc081] tracking-[2px] uppercase select-none mb-2">
            CHECK YOUR EMAIL
          </h2>
          <p className="font-mono text-[10px] text-[#a38d7a] uppercase tracking-wider mb-6">
            TRANSMISSION STABLE // GATEWAY UNLOCKED
          </p>

          <p className="font-mono text-xs text-[#e4e1e6] bg-[#1a2520] border border-[#6ee7b7]/30 p-4 mb-6 leading-relaxed uppercase">
            We sent a verification link to <span className="text-[#6ee7b7] font-bold break-all">{email}</span>. Please click the link inside your inbox to establish profile authorization.
          </p>

          <a 
            href="/auth/login" 
            className="w-full py-3.5 bg-[#ffc081] text-[#2c1600] font-mono font-bold text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all text-center rounded-none select-none"
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
          ⚡ CREATING OPERATOR CORE ⚡
        </div>

        {/* ZEN_OS logo & subtitle */}
        <h1 className="font-anton text-5xl text-[#ffc081] tracking-[3px] leading-none mb-1 shadow-sm uppercase select-none">
          ZEN_OS
        </h1>
        <p className="font-mono text-[10px] text-[#a38d7a] uppercase tracking-[2px] mb-6 select-none border-b border-[#554434] w-2/3 pb-2 text-center">
          PROFILE DISPATCH STATION
        </p>

        {errorMsg && (
          <div className="w-full text-left font-mono text-[10px] text-[#ffb4ab] bg-[#2d1615] border border-[#ffb4ab]/30 p-3 mb-5 uppercase tracking-wide leading-relaxed">
            ❌ SYSTEM BREACH LEVEL 1:<br />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSignUp} className="w-full text-left space-y-3.5">
          <div>
            <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">OPERATOR FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="Elon C. Dante"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">EMAIL ADDRESS ID</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="operator@system.io"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">PASSWORD CIPHER</label>
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
            <label className="block font-mono text-[8.5px] text-[#a38d7a] uppercase tracking-wider mb-1">CONFIRM PASSWORD CIPHER</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-[42px] px-3.5 bg-[#1f1f22] border border-[#554434] text-[#e4e1e6] font-mono text-xs rounded-none focus:border-[#ffc081] focus:shadow-[0_0_10px_rgba(255,192,129,0.3)] focus:outline-none transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>

          {/* Dynamic Password Verification Stream */}
          <div className="bg-[#17171d] border border-[#554434] p-3 text-left font-mono text-[9px] uppercase tracking-wide space-y-1.5 select-none">
            <div className="text-[#a38d7a] border-b border-[#554434] pb-1 font-bold text-[8px] tracking-wider">SECURE KEY CHECKS:</div>
            
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
            {loading ? 'CREATING SYSTEM VAULT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="w-full my-5 flex items-center justify-between">
          <span className="h-px bg-[#554434] flex-1"></span>
          <span className="font-mono text-[10px] text-[#a38d7a] px-3">OR</span>
          <span className="h-px bg-[#554434] flex-1"></span>
        </div>

        {/* Continue with Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full h-[46px] border border-[#554434] bg-transparent text-[#dbc2ad] font-mono font-bold text-[10.5px] uppercase tracking-wider rounded-none hover:bg-white/5 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[17px] h-[17px] shrink-0">
            <path fill="#dbc2ad" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
            <path fill="#dbc2ad" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#dbc2ad" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#dbc2ad" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        {/* Router redirects */}
        <div className="w-full mt-6 pt-3 border-t border-[#554434]/45 flex justify-center font-mono text-[9px] text-[#a38d7a] uppercase tracking-wide">
          <a href="/auth/login" className="hover:text-[#ffc081] transition-colors">ALREADY HAVE A PASS KEY? SIGN IN</a>
        </div>
      </div>
    </div>
  );
}
