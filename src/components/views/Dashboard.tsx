"use client";

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence, useMotionValue, useSpring, animate } from 'motion/react';
import { useZenos } from '../../context/ZenosContext';
import TaskCard from '../ui/TaskCard';
import { today } from '../../lib/utils';

// High-performance React spring count-up helper
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 120, damping: 16 });

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, motionValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });
  }, [springValue]);

  return <>{displayValue}</>;
}

export default function Dashboard() {
  const { state, updateState, googleEvents, loadingEvents } = useZenos();
  const shouldReduce = useReducedMotion();
  const tasks = state.filterCat ? state.tasks.filter(t => t.cat === state.filterCat) : state.tasks;
  const done = tasks.filter(t => t.status === 'done').length;
  const prog = tasks.filter(t => t.status === 'inprogress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const todayTasks = tasks.filter(t => t.date === today());

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 18 }
    }
  };

  // Extract upcoming 3 Google Calendar events chronologically
  const now = new Date();
  const upcomingGoogleEvents = (googleEvents || [])
    .filter(ev => {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) return false;
      return new Date(startStr) >= now;
    })
    .sort((a, b) => {
      const aStart = new Date(a.start?.dateTime || a.start?.date || '');
      const bStart = new Date(b.start?.dateTime || b.start?.date || '');
      return aStart.getTime() - bStart.getTime();
    })
    .slice(0, 3);

  function formatGoogleTime(startStr?: { dateTime?: string; date?: string }) {
    if (!startStr) return '';
    const dateObj = new Date(startStr.dateTime || startStr.date || '');
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' @ ' + dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4"
      >
        {[
          { num: tasks.length, label: 'Total Tasks', color: 'text-text' },
          { num: done, label: 'Completed', color: 'text-green' },
          { num: prog, label: 'In Progress', color: 'text-primary' },
          { num: todo, label: 'To Do', color: 'text-amber' },
        ].map(s => (
          <motion.div 
            key={s.label} 
            variants={statCardVariants}
            className="bg-surface-low border border-border p-3.5 relative overflow-hidden"
          >
            <div className={`font-anton text-[30px] tracking-wide ${s.color}`}>
              {shouldReduce ? s.num : <AnimatedNumber value={s.num} />}
            </div>
            <div className="font-mono text-[9px] text-text3 mt-0.5 uppercase tracking-wide">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Overall Progress Section */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-surface-low border border-border p-3.5 mb-4"
      >
        <div className="flex items-center justify-between mb-2.5">
          <span className="font-mono text-[10px] text-text3 uppercase tracking-wide">Overall Progress</span>
          <span className="font-mono text-[12px] text-secondary">
            {shouldReduce ? `${pct}%` : <><AnimatedNumber value={pct} />%</>} OPTIMIZED
          </span>
        </div>
        
        {/* Progress Bar with Glint shimmer */}
        <div className="h-2 bg-surface-high border border-border overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-primary to-secondary relative"
          >
            {!shouldReduce && (
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              />
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Upcoming from Google Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-surface-low border border-border p-3.5 mb-4"
      >
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-primary uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
            Upcoming from Google // Telemetry Sync
          </div>
          {loadingEvents && (
            <div className="font-mono text-[8px] text-text3 animate-pulse uppercase">
              SCANNING STREAM...
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {upcomingGoogleEvents.length > 0 ? (
            upcomingGoogleEvents.map(ev => {
              const meetLink = ev.hangoutLink || ev.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
              return (
                <div key={ev.id} className="bg-surface-high border border-border p-2.5 flex flex-col justify-between min-h-[88px] group hover:border-[#a5e7ff]/40 transition-colors">
                  <div>
                    <div className="font-mono text-[9px] text-[#a5e7ff] mb-1.5 uppercase font-semibold">
                      {formatGoogleTime(ev.start)}
                    </div>
                    <div className="text-[11px] font-bold text-text truncate mb-2 leading-tight group-hover:text-primary transition-colors">
                      {ev.summary || '(No Subject)'}
                    </div>
                  </div>
                  {meetLink && (
                    <a
                      href={meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 w-fit px-2.5 py-1.5 bg-secondary text-[#0a161c] text-[9px] font-mono font-bold uppercase transition-all duration-150 hover:brightness-110 active:scale-[0.98] select-none rounded-none text-center"
                    >
                      ⚡ Join Meet
                    </a>
                  )}
                </div>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-4 font-mono text-[10px] text-text3 uppercase select-none border border-dashed border-border/60">
              No upcoming Google Calendar events
            </div>
          )}
        </div>
      </motion.div>

      {todayTasks.length > 0 && (
        <>
          <div className="section-header mt-1">
            <div className="section-title">Today</div>
          </div>
          <div className="flex flex-col">
            <AnimatePresence mode="popLayout">
              {todayTasks.map((t, idx) => (
                <TaskCard key={t.id} task={t} index={idx} />
              ))}
            </AnimatePresence>
          </div>
          <div className="h-2" />
        </>
      )}

      <div className="section-header">
        <div className="section-title">
          All Tasks {state.filterCat && `// ${state.categories.find(c => c.id === state.filterCat)?.label}`}
        </div>
        {state.filterCat && (
          <button 
            className="font-mono text-[10px] text-text3 border border-dashed border-border px-2.5 py-1 hover:text-primary hover:border-primary bg-transparent cursor-pointer" 
            onClick={() => updateState({ filterCat: null })}
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {tasks.length > 0 ? (
          <AnimatePresence mode="popLayout">
            {tasks.map((t, idx) => (
              <TaskCard key={t.id} task={t} index={idx} />
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="text-center py-12 text-text3 text-[11px] font-mono"
          >
            <span className="material-symbols-outlined text-[32px] block mb-2.5 opacity-20 mx-auto">inbox</span>
            No tasks yet — press ⌘K to add one
          </motion.div>
        )}
      </div>
    </>
  );
}
