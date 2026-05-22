"use client";

import { useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import { ZenosProvider, useZenos } from './context/ZenosContext';
import Dashboard from './components/views/Dashboard';
import Kanban from './components/views/Kanban';
import Calendar from './components/views/Calendar';
import Analytics from './components/views/Analytics';
import Vault from './components/views/Vault';
import Meetings from './components/views/Meetings';
import DanteAI from './components/views/DanteAI';
import LoginView from './components/views/LoginView';
import Modals from './components/Modals';
import MorningBriefing from './components/MorningBriefing';

function MainAppLayout() {
  const { state, user, isLoadingData, updateState, showBriefing, setShowBriefing } = useZenos();
  const shouldReduce = useReducedMotion();

  // Automatic Morning Briefing trigger checker: runs on database loads completed
  useEffect(() => {
    if (user && !isLoadingData) {
      const todayStr = new Date().toISOString().split('T')[0];
      const hours = new Date().getHours();
      
      // Between 5:00 AM and 11:00 AM
      const isMorning = hours >= 5 && hours < 11;

      try {
        const alreadySeen = localStorage.getItem(`zenos_briefing_seen_${todayStr}`);
        if (isMorning && !alreadySeen) {
          setShowBriefing(true);
        }
      } catch (err) {
        console.error("Failed to query briefing storage log:", err);
      }
    }
  }, [user, isLoadingData, setShowBriefing]);

  // If user does not have an active session, display the auth portal instantly with no loading gate
  if (!user) {
    return <LoginView />;
  }

  // If user has an active session but initial sync channels are fetching cloud/database states, render the terminal loader (max 3 sec timeout)
  if (isLoadingData) {
    return (
      <div className="min-h-screen w-screen bg-[#131316] text-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden select-none font-mono">
        <div className="absolute inset-0 pointer-events-none bg-speed-lines opacity-40 z-0" />
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ffc081]/5 rounded-full blur-[100px] pointer-events-none z-0" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-[#ffc081]/15 border border-[#ffc081] flex items-center justify-center rounded-none mb-4 animate-spin text-[#ffc081]">
            <span className="material-symbols-outlined text-[20px]">sync</span>
          </div>
          <div className="text-[#ffc081] animate-pulse uppercase tracking-[4px] text-[10px] font-bold text-center">
            ⚡ SECURING SYS PROTOCOLS... ⚡
          </div>
          <div className="text-[#a38d7a] text-[8px] mt-2 uppercase tracking-wider text-center">
            CONNECTING CLOUD DATABASES
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden relative z-10 select-none bg-bg text-text pb-safe">
      {/* Background speed lines */}
      <div className="absolute inset-0 pointer-events-none bg-speed-lines z-0 opacity-40 animate-pulse" />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <Topbar />
        
        {/*
          We keep all core views mounted simultaneously within the layout to guarantee 
          that scroll matrices, ticking stopwatch sessions, input text buffers, and active channels 
          are never dropped on navigation. We switch views instantly via CSS toggles.
        */}
        <div className="flex-1 overflow-hidden relative z-10 p-4 pb-[76px] md:pb-5 md:p-5 bg-bg transition-colors duration-200">
          <div className="w-full h-full relative">
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'dashboard' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <Dashboard />
            </div>
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'kanban' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <Kanban />
            </div>
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'calendar' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <Calendar />
            </div>
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'meetings' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <Meetings />
            </div>
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'analytics' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <Analytics />
            </div>
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'vault' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <Vault />
            </div>
            <div className={`w-full h-full overflow-y-auto absolute inset-0 ${state.view === 'dante' ? 'block opacity-100 transition-opacity duration-200' : 'hidden opacity-0 pointer-events-none'}`}>
              <DanteAI />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom tab bar for mobile view only (< 768px) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-surface-low border-t border-border flex items-center justify-around z-40 px-2 pb-safe select-none">
        {[
          { id: 'dashboard', icon: 'dashboard', label: 'Home' },
          { id: 'kanban', icon: 'view_kanban', label: 'Board' },
          { id: 'calendar', icon: 'calendar_today', label: 'Cal' },
          { id: 'meetings', icon: 'handshake', label: 'Meet' },
          { id: 'vault', icon: 'folder_open', label: 'Vault' },
          { id: 'dante', icon: 'psychology', label: 'Dante' }
        ].map(v => (
          <button 
            key={v.id}
            onClick={() => updateState({ view: v.id })}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 text-text3 transition-colors duration-150 cursor-pointer ${state.view === v.id ? 'text-primary! font-bold scale-105' : 'hover:text-text'}`}
          >
            <span className="material-symbols-outlined text-[18px]">{v.icon}</span>
            <span className="font-mono text-[8px] uppercase tracking-wider">{v.label}</span>
          </button>
        ))}
      </div>

      <Modals />
      <MorningBriefing />
    </main>
  );
}

export default function App() {
  return (
    <ZenosProvider>
      <MainAppLayout />
    </ZenosProvider>
  );
}
