"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from 'motion/react';
import { useZenos } from '../context/ZenosContext';
import { createGoogleCalendarEvent } from '../lib/googleCalendar';

export default function Topbar() {
  const { state, updateState, toggleTheme, setShowModal, fetchGoogleEvents, accessToken, setShowBriefing } = useZenos();
  const shouldReduce = useReducedMotion();
  const [spinCount, setSpinCount] = useState(0);
  const [instantCreating, setInstantCreating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { 
        e.preventDefault(); 
        setShowModal('addTask'); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setShowModal]);

  const handleThemeToggle = () => {
    setSpinCount(p => p + 1);
    toggleTheme();
  };

  const handleInstantMeeting = async () => {
    if (instantCreating) return;
    setInstantCreating(true);
    try {
      const token = accessToken;
      if (!token) {
        throw new Error('Google authentication credentials are required. Sign in again.');
      }

      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000); // 1-hour session duration

      const dateStr = now.toISOString().split('T')[0];
      const startTime = now.toTimeString().split(' ')[0].substring(0, 5);
      const endTime = end.toTimeString().split(' ')[0].substring(0, 5);

      const created = await createGoogleCalendarEvent(token, {
        summary: '⚡ Instant Meet (ZEN_OS)',
        description: 'Instant meeting room created via ZEN_OS. Use this secure room to sync on active priorities.',
        date: dateStr,
        startTime,
        endTime,
        addMeetLink: true
      });

      // Synchronize in-memory events list
      await fetchGoogleEvents();

      // Dispatch to main modals pipeline
      updateState({
        instantMeetEvent: created
      });

      setShowModal('instantMeetSuccess');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to dispatch immediate conference gateway.');
    } finally {
      setInstantCreating(false);
    }
  };

  const glowPulseVariants = {
    animate: {
      boxShadow: [
        "0 0 0px rgba(255,192,129,0)",
        "0 0 10px rgba(255,192,129,0.35)",
        "0 0 0px rgba(255,192,129,0)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const views = ['dashboard', 'kanban', 'calendar', 'analytics', 'meetings', 'vault', 'dante'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-[52px] bg-surface-low border-b border-border px-4 flex items-center shrink-0"
    >
      <div className="hidden lg:flex items-center gap-[4px] bg-surface-high border border-border p-0.5 max-w-[calc(100vw-180px)] overflow-x-auto scrollbar-none select-none">
        {views.map(v => (
          <button 
            key={v}
            onClick={() => updateState({ view: v })}
            className={`view-tab whitespace-nowrap px-2 md:px-3 text-[10px] md:text-[11px] ${state.view === v ? 'active' : ''}`}
          >
            {v === 'dante' ? 'Dante AI' : v}
          </button>
        ))}
      </div>

      <div className="lg:hidden flex items-center gap-1.5 mr-auto">
        <span className="font-anton text-sm tracking-[1.5px] text-primary">ZEN_OS</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-auto select-none">
        <span className="hidden xl:inline-block font-mono text-[9px] text-text3 border border-border px-1.5 py-0.5">⌘K</span>
        
        {/* Morning Briefing Manual Trigger Button */}
        <motion.button 
          whileTap={shouldReduce ? undefined : { scale: 0.94 }}
          onClick={() => setShowBriefing(true)}
          className="flex items-center justify-center gap-1 px-2.5 md:px-3 py-1.5 bg-surface-mid border border-border hover:border-primary text-primary text-[11px] font-mono font-bold tracking-wider uppercase transition-all select-none h-8 cursor-pointer rounded-none"
          title="Open Dante Morning Briefing Report"
        >
          <span className="material-symbols-outlined text-[15px] leading-none animate-spin [animation-duration:10s]">sunny</span>
          <span className="hidden sm:inline">BRIEFING</span>
        </motion.button>

        <motion.button 
          whileTap={shouldReduce ? undefined : { scale: 0.9 }}
          className="icon-btn" 
          onClick={handleThemeToggle}
        >
          <motion.span 
            animate={{ rotate: shouldReduce ? 0 : spinCount * 360 }}
            transition={{ type: "spring", stiffness: 180, damping: 15 }}
            className="material-symbols-outlined text-[18px]"
          >
            {state.theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </motion.span>
        </motion.button>

        {/* Instant Meet Button */}
        <motion.button
          whileTap={shouldReduce ? undefined : { scale: 0.96 }}
          disabled={instantCreating}
          className="flex items-center justify-center gap-1 px-2.5 md:px-3 py-1.5 border border-[#a5e7ff] text-[#a5e7ff] hover:bg-[#a5e7ff]/8 text-[11px] font-mono font-bold tracking-wide uppercase transition-all cursor-pointer disabled:opacity-50 select-none rounded-none h-8"
          onClick={handleInstantMeeting}
          title="Instant Meet"
        >
          <span className="material-symbols-outlined text-[15.5px] leading-none">bolt</span>
          <span className="hidden lg:inline">{instantCreating ? 'CREATING...' : 'INSTANT MEET'}</span>
        </motion.button>

        {/* Add Task Button */}
        <motion.button
          variants={shouldReduce ? undefined : glowPulseVariants}
          animate="animate"
          whileTap={shouldReduce ? undefined : { scale: 0.96 }}
          className="flex items-center justify-center gap-1 px-2.5 md:px-3.5 py-1.5 bg-primary text-[#2c1600] text-[11px] font-mono font-bold tracking-wide uppercase hover:brightness-110 transition-all cursor-pointer border-none h-8"
          onClick={() => setShowModal('addTask')}
          title="Add Task"
        >
          <span className="material-symbols-outlined text-[15px]">add</span> 
          <span className="hidden lg:inline">Add Task</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
