import React, { createContext, useContext, useState, useEffect } from 'react';
import { ZenosState, Task, Category, VaultItem } from '../types';
import { today } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { fetchGoogleCalendarEvents } from '../lib/googleCalendar';

const DEFAULT_STATE: ZenosState = {
  view: 'dashboard',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  theme: 'dark',
  filterCat: null,
  tasks: [],
  categories: [
    { id: 'radio', label: 'Radio Work', color: '#d5c3ff' },
    { id: 'research', label: 'Research', color: '#a5e7ff' },
    { id: 'application', label: 'Application', color: '#ff9800' },
    { id: 'other', label: 'Other', color: '#888' },
  ],
  specialTasks: [],
  vault: [],
  danteHistory: [],
  completionLog: [],
  selectedDate: null,
  meetings: [
    {
      id: 'demo-meet-1',
      personName: 'Professor Dante',
      date: '2026-05-23',
      time: '14:30',
      subject: 'Review AI Agent Architecture and Sprint Goals',
      status: 'upcoming',
      elapsedSeconds: 0,
      notes: 'Initial meeting to set milestones.',
      createdAt: '2026-05-22T00:00:00Z'
    }
  ]
};

interface ZenosContextType {
  state: ZenosState;
  updateState: (updates: Partial<ZenosState>) => void;
  toggleTheme: () => void;
  toggleTaskDone: (id: number | string) => Promise<void>;
  deleteTask: (id: number | string) => Promise<void>;
  addTask: (task: Omit<Task, 'id'>) => Promise<void>;
  editTask: (id: number | string, updates: Partial<Task>) => Promise<void>;
  addCategory: (label: string, color: string) => Promise<void>;
  addVaultItem: (item: Omit<VaultItem, 'id' | 'addedAt'>) => Promise<void>;
  deleteVaultItem: (id: string) => Promise<void>;
  showModal: string | null;
  setShowModal: (m: string | null) => void;
  editTaskId: number | string | null;
  setEditTaskId: (id: number | string | null) => void;
  user: any | null;
  accessToken: string | null;
  googleEvents: any[];
  setGoogleEvents: React.Dispatch<React.SetStateAction<any[]>>;
  loadingEvents: boolean;
  isLoadingData: boolean;
  loginWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  fetchGoogleEvents: () => Promise<void>;
  loginOffline: (email?: string, name?: string) => void;
  showBriefing: boolean;
  setShowBriefing: (show: boolean) => void;
  saveDanteMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  clearDanteHistory: () => Promise<void>;
}

const ZenosContext = createContext<ZenosContextType | null>(null);

export const ZenosProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ZenosState>(DEFAULT_STATE);
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editTaskId, setEditTaskId] = useState<number | string | null>(null);

  // Authentication & Google API values
  const [user, setUser] = useState<any | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  // Load database metadata for an authenticated user
  const fetchUserData = async (userId: string) => {
    const isOffline = userId === 'offline-user-123' || !supabase.auth || !supabase.from;
    if (isOffline) {
      try {
        const savedTasks = localStorage.getItem('zenos_tasks');
        const savedCats = localStorage.getItem('zenos_categories');
        const savedVault = localStorage.getItem('zenos_vault');
        const savedMessages = localStorage.getItem('zenos_dante_history');

        setState(s => ({
          ...s,
          tasks: savedTasks ? JSON.parse(savedTasks) : s.tasks,
          categories: savedCats ? JSON.parse(savedCats) : s.categories,
          vault: savedVault ? JSON.parse(savedVault) : s.vault,
          danteHistory: savedMessages ? JSON.parse(savedMessages) : s.danteHistory
        }));
      } catch (err) {
        console.error('Error loading fallback user data:', err);
      }
      return;
    }

    try {
      // Guard all sequential Supabase fetches behind a collective 2500ms timeout race.
      await Promise.race([
        (async () => {
          // Fetch tasks
          const { data: dbTasks, error: err1 } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: true });

          if (err1) throw err1;

          // Fetch categories
          let { data: dbCats, error: err2 } = await supabase
            .from('categories')
            .select('*');

          if (err2) throw err2;

          // Seed default categories if none exist
          if (dbCats && dbCats.length === 0) {
            const defaults = [
              { label: 'Radio Work', color: '#d5c3ff' },
              { label: 'Research', color: '#a5e7ff' },
              { label: 'Application', color: '#ff9800' },
              { label: 'Other', color: '#888' },
            ];
            const { data: inserted, error: insertError } = await supabase
              .from('categories')
              .insert(defaults.map(d => ({ ...d, user_id: userId })))
              .select();
            
            if (insertError) {
              console.error('Failed to seed default categories:', insertError);
            } else if (inserted) {
              dbCats = inserted;
            }
          }

          // Fetch vault items
          const { data: dbVault, error: err3 } = await supabase
            .from('vault_items')
            .select('*')
            .order('added_at', { ascending: false });

          if (err3) throw err3;

          // Fetch Dante chat memory history
          let dbDante: any[] = [];
          try {
            const { data, error: errDante } = await supabase
              .from('dante_messages')
              .select('*')
              .order('created_at', { ascending: true })
              .limit(20);
            if (data && !errDante) {
              dbDante = data;
            }
          } catch (errD) {
            console.warn('Could not query dante_messages, schema update may be pending:', errD);
          }

          setState(s => ({
            ...s,
            tasks: (dbTasks || []).map((t: any) => ({
              id: t.id,
              title: t.title,
              cat: t.cat || 'other',
              status: (t.status || 'todo') as 'todo' | 'inprogress' | 'done',
              date: t.date || '',
              reminder: t.reminder || '',
              note: t.note || '',
              progress: t.progress || 0,
              steps: t.steps || []
            })),
            categories: (dbCats || []).map((c: any) => ({
              id: c.id,
              label: c.label,
              color: c.color || '#888'
            })),
            vault: (dbVault || []).map((v: any) => ({
              id: v.id,
              type: (v.type || 'link') as 'file' | 'link',
              name: v.name,
              detail: v.detail || '',
              url: v.url || '',
              addedAt: v.added_at
            })),
            danteHistory: dbDante.length > 0 ? dbDante.map((dm: any) => ({
              role: dm.role,
              content: dm.content,
              ts: new Date(dm.created_at).getTime()
            })) : s.danteHistory
          }));
        })(),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('Supabase request timeout')), 2500)
        )
      ]);

    } catch (err) {
      console.error('Failed drawing user information from Supabase:', err);
      // Fallback load offline/cached local data
      try {
        const savedTasks = localStorage.getItem('zenos_tasks');
        const savedCats = localStorage.getItem('zenos_categories');
        const savedVault = localStorage.getItem('zenos_vault');
        const savedMessages = localStorage.getItem('zenos_dante_history');

        setState(s => ({
          ...s,
          tasks: savedTasks ? JSON.parse(savedTasks) : s.tasks,
          categories: savedCats ? JSON.parse(savedCats) : s.categories,
          vault: savedVault ? JSON.parse(savedVault) : s.vault,
          danteHistory: savedMessages ? JSON.parse(savedMessages) : s.danteHistory
        }));
      } catch (err2) {
        console.error('Error during database recovery fallback load:', err2);
      }
    }
  };

  // Safety timeout: Never let isLoadingData stay true forever. Force false after a max 3 seconds.
  useEffect(() => {
    if (isLoadingData) {
      const timer = setTimeout(() => {
        setIsLoadingData(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoadingData]);

  // Synchronous session tracking with Supabase Auth (runs in background)
  useEffect(() => {
    const handleInitialSession = async () => {
      // Do NOT set isLoadingData(true) here because we want to show the login screen instantly
      try {
        const sessionResult = await Promise.race([
          supabase.auth.getSession(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Auth getSession timeout')), 2000))
        ]).catch(err => {
          console.warn('Initial session check timed out or failed. Defaulting to local check:', err);
          return { data: { session: null } };
        });

        const session = sessionResult?.data?.session || null;
        if (session) {
          setUser(session.user);
          if (session.provider_token) {
            setAccessTokenState(session.provider_token);
          }
          // We got a real user session! Briefly show loading during fetch, but with safety guard active
          setIsLoadingData(true);
          await fetchUserData(session.user.id);
        } else {
          setUser(null);
          setAccessTokenState(null);
        }
      } catch (err) {
        console.error('Initial session fetch failed:', err);
      } finally {
        setIsLoadingData(false);
        setMounted(true);
      }
    };

    handleInitialSession();

    let subscription: any = null;
    try {
      const authListener = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          setUser(session.user);
          if (session.provider_token) {
            setAccessTokenState(session.provider_token);
          }
          const isOffline = session.user.id === 'offline-user-123';
          if (!isOffline) {
            setIsLoadingData(true);
            try {
              await fetchUserData(session.user.id);
            } catch (err) {
              console.error('Error in onAuthStateChange fetchUserData:', err);
            } finally {
              setIsLoadingData(false);
            }
          }
        } else {
          setUser(null);
          setAccessTokenState(null);
          setState(s => ({
            ...s,
            tasks: [],
            categories: [
              { id: 'radio', label: 'Radio Work', color: '#d5c3ff' },
              { id: 'research', label: 'Research', color: '#a5e7ff' },
              { id: 'application', label: 'Application', color: '#ff9800' },
              { id: 'other', label: 'Other', color: '#888' },
            ],
            vault: [],
            meetings: s.meetings || []// Demostart item remains
          }));
        }
      });
      subscription = authListener?.data?.subscription || authListener?.data || authListener;
    } catch (authErr) {
      console.error('Error registering auth state listener:', authErr);
    }

    return () => {
      if (subscription) {
        if (typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        } else if (typeof subscription === 'function') {
          (subscription as any)();
        }
      }
    };
  }, []);

  // Save changes & apply stylesheet classes
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('light-mode', state.theme === 'light');
      document.body.classList.toggle('light-mode', state.theme === 'light');
    }
  }, [state.theme, mounted]);

  // Handle Google OAuth events querying
  const fetchGoogleEvents = async () => {
    const token = accessToken;
    if (!token) return;
    setLoadingEvents(true);
    try {
      const items = await fetchGoogleCalendarEvents(token, state.calYear, state.calMonth);
      setGoogleEvents(items);
    } catch (err) {
      console.error('Failed to query Google Calendar streams:', err);
      if (err instanceof Error && err.message.toLowerCase().includes('unauthorized')) {
        setAccessTokenState(null);
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  // Sync Google Events when token or dates shift
  useEffect(() => {
    if (accessToken) {
      fetchGoogleEvents();
    }
  }, [accessToken, state.calYear, state.calMonth]);

  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google authorization integration path failure:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setAccessTokenState(null);
      setGoogleEvents([]);
    } catch (error) {
      console.error('Auth signout execution path failed:', error);
    }
  };

  const updateState = (updates: Partial<ZenosState>) => setState(s => ({ ...s, ...updates }));
  const toggleTheme = () => updateState({ theme: state.theme === 'dark' ? 'light' : 'dark' });

  // REALTIME SUPABASE OPERATIONS

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: user.id,
          title: taskData.title,
          cat: taskData.cat,
          status: taskData.status,
          date: taskData.date,
          reminder: taskData.reminder,
          note: taskData.note,
          progress: taskData.progress,
          steps: taskData.steps || []
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const mapped: Task = {
          id: data.id,
          title: data.title,
          cat: data.cat || 'other',
          status: (data.status || 'todo') as 'todo' | 'inprogress' | 'done',
          date: data.date || '',
          reminder: data.reminder || '',
          note: data.note || '',
          progress: data.progress || 0,
          steps: data.steps || []
        };
        setState(s => ({
          ...s,
          tasks: [...s.tasks, mapped]
        }));
      }
    } catch (err) {
      console.error('Error adding task in client:', err);
    }
  };

  const editTask = async (id: number | string, updates: Partial<Task>) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          cat: updates.cat,
          status: updates.status,
          date: updates.date,
          reminder: updates.reminder,
          note: updates.note,
          progress: updates.progress,
          steps: updates.steps
        })
        .eq('id', id);

      if (error) throw error;

      setState(s => ({
        ...s,
        tasks: s.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      }));
    } catch (err) {
      console.error('Error editing task in client:', err);
    }
  };

  const deleteTask = async (id: number | string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setState(s => ({
        ...s,
        tasks: s.tasks.filter(t => t.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting task in client:', err);
    }
  };

  const toggleTaskDone = async (id: number | string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task || !user) return;
    const isDone = task.status === 'done';
    const updatedStatus = isDone ? 'inprogress' as const : 'done' as const;
    const updatedProgress = isDone ? (task.progress === 100 ? 50 : task.progress) : 100;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: updatedStatus,
          progress: updatedProgress
        })
        .eq('id', id);

      if (error) throw error;

      setState(s => {
        const newTasks = s.tasks.map(t => {
          if (t.id !== id) return t;
          return {
            ...t,
            status: updatedStatus,
            progress: updatedProgress,
          };
        });
        return { ...s, tasks: newTasks, completionLog: [...s.completionLog, today()] };
      });
    } catch (err) {
      console.error('Error toggling task in client:', err);
    }
  };

  const addCategory = async (label: string, color: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          label,
          color,
          slug: label.toLowerCase().replace(/\s+/g, '-')
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const mapped: Category = {
          id: data.id,
          label: data.label,
          color: data.color || '#888'
        };
        setState(s => ({
          ...s,
          categories: [...s.categories, mapped]
        }));
      }
    } catch (err) {
      console.error('Error adding category in client:', err);
    }
  };

  const addVaultItem = async (item: Omit<VaultItem, 'id' | 'addedAt'>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('vault_items')
        .insert({
          user_id: user.id,
          type: item.type,
          name: item.name,
          detail: item.detail,
          url: item.url || ''
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        const mapped: VaultItem = {
          id: data.id,
          type: (data.type || 'link') as 'file' | 'link',
          name: data.name,
          detail: data.detail || '',
          url: data.url || '',
          addedAt: data.added_at
        };
        setState(s => ({
          ...s,
          vault: [...s.vault, mapped]
        }));
      }
    } catch (err) {
      console.error('Error adding vault item in client:', err);
    }
  };

  const deleteVaultItem = async (id: string) => {
    if (!user) return;
    const isOffline = user.id === 'offline-user-123' || !supabase.auth || !supabase.from;
    if (isOffline) {
      setState(s => {
        const updated = s.vault.filter(v => v.id !== id);
        try {
          localStorage.setItem('zenos_vault', JSON.stringify(updated));
        } catch (e) {}
        return { ...s, vault: updated };
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('vault_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setState(s => ({
        ...s,
        vault: s.vault.filter(v => v.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting vault item in client:', err);
    }
  };

  const loginOffline = (email?: string, name?: string) => {
    setIsLoadingData(false);
    setMounted(true);
    const offlineUser = {
      id: 'offline-user-123',
      email: email || 'offline-operator@system.io',
      user_metadata: {
        full_name: name || 'Offline Operator'
      }
    };
    setUser(offlineUser);
    
    // Seed/load local offline data
    try {
      const savedTasks = localStorage.getItem('zenos_tasks');
      const savedCats = localStorage.getItem('zenos_categories');
      const savedVault = localStorage.getItem('zenos_vault');
      const savedMessages = localStorage.getItem('zenos_dante_history');

      setState(s => ({
        ...s,
        tasks: savedTasks ? JSON.parse(savedTasks) : s.tasks,
        categories: savedCats ? JSON.parse(savedCats) : s.categories,
        vault: savedVault ? JSON.parse(savedVault) : s.vault,
        danteHistory: savedMessages ? JSON.parse(savedMessages) : s.danteHistory
      }));
    } catch (err) {
      console.error('Error seeding local database fallback:', err);
    }
  };

  const saveDanteMessage = async (role: 'user' | 'assistant', content: string) => {
    const ts = Date.now();
    const nextMsg = { role, content, ts };

    setState(s => ({
      ...s,
      danteHistory: [...s.danteHistory, nextMsg].slice(-20)
    }));

    if (user && user.id !== 'offline-user-123') {
      try {
        await supabase
          .from('dante_messages')
          .insert({
            user_id: user.id,
            role,
            content
          });
      } catch (err) {
        console.error('Failed to save Dante message to Supabase:', err);
      }
    } else {
      try {
        const current = localStorage.getItem('zenos_dante_history');
        const list = current ? JSON.parse(current) : [];
        list.push(nextMsg);
        localStorage.setItem('zenos_dante_history', JSON.stringify(list.slice(-20)));
      } catch (e) {
        console.error('Failed to save message to localStorage fallback:', e);
      }
    }
  };

  const clearDanteHistory = async () => {
    setState(s => ({ ...s, danteHistory: [] }));
    if (user && user.id !== 'offline-user-123') {
      try {
        await supabase
          .from('dante_messages')
          .delete()
          .eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to purge dante conversation in Supabase:', err);
      }
    } else {
      try {
        localStorage.removeItem('zenos_dante_history');
      } catch (e) {}
    }
  };

  return (
    <ZenosContext.Provider value={{
      state,
      updateState,
      toggleTheme,
      toggleTaskDone,
      deleteTask,
      addTask,
      editTask,
      addCategory,
      addVaultItem,
      deleteVaultItem,
      showModal,
      setShowModal,
      editTaskId,
      setEditTaskId,
      user,
      accessToken,
      googleEvents,
      setGoogleEvents,
      loadingEvents,
      isLoadingData,
      loginWithGoogle,
      logOut,
      fetchGoogleEvents,
      loginOffline,
      showBriefing,
      setShowBriefing,
      saveDanteMessage,
      clearDanteHistory
    }}>
      {children}
    </ZenosContext.Provider>
  );
};

export const useZenos = () => {
  const ctx = useContext(ZenosContext);
  if (!ctx) throw new Error("useZenos must be used within ZenosProvider");
  return ctx;
};
