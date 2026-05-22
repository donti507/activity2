import { createClient } from '@supabase/supabase-js';

const getEnvUrl = () => {
  const url = 
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) || 
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_URL) || 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || 
    "";
  
  if (!url || url === "your_supabase_project_url" || !url.startsWith("http")) {
    return "https://placeholder-project.supabase.co";
  }
  return url;
};

const getEnvKey = () => {
  const key = 
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || 
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
    "";
  
  if (!key || key === "your_supabase_anon_key") {
    // Provide a valid structure fallback anon key so jwt parsing inside SDK doesn't complain.
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjYwMDAwMDAwMH0.abcdefghijklmnopqrstuvwxyz1234567890";
  }
  return key;
};

const getResilientStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return window.localStorage;
    }
  } catch (e) {
    console.warn("Supabase auth falling back to in-memory storage because localStorage is restricted/blocked.");
  }
  
  return {
    getItem: (key: string): string | null => {
      if (typeof window !== 'undefined') {
        return (window as any).__supabase_fallback_store?.[key] || null;
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      if (typeof window !== 'undefined') {
        if (!(window as any).__supabase_fallback_store) {
          (window as any).__supabase_fallback_store = {};
        }
        (window as any).__supabase_fallback_store[key] = value;
      }
    },
    removeItem: (key: string): void => {
      if (typeof window !== 'undefined' && (window as any).__supabase_fallback_store) {
        delete (window as any).__supabase_fallback_store[key];
      }
    }
  };
};

const supabaseUrl = getEnvUrl();
const supabaseAnonKey = getEnvKey();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: getResilientStorage()
  }
});

