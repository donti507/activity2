"use client";

import { motion, useReducedMotion } from 'motion/react';
import { useZenos } from '../context/ZenosContext';
import { fmtDateTime, getCatColor } from '../lib/utils';

export default function Sidebar() {
  const { state, updateState, setShowModal, user, logOut } = useZenos();
  const shouldReduce = useReducedMotion();

  const views = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'kanban', icon: 'view_kanban', label: 'Board' },
    { id: 'calendar', icon: 'calendar_today', label: 'Calendar' },
    { id: 'meetings', icon: 'handshake', label: 'Meetings' },
    { id: 'analytics', icon: 'analytics', label: 'Analytics' },
    { id: 'vault', icon: 'folder_open', label: 'Vault' },
  ];

  const upcoming = state.tasks
    .filter(t => t.reminder && new Date(t.reminder) > new Date() && t.status !== 'done')
    .sort((a, b) => new Date(a.reminder).getTime() - new Date(b.reminder).getTime())
    .slice(0, 4);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 250, damping: 22 }
    }
  };

  const danteGlowVariants = {
    animate: {
      scale: [1, 1.08, 1],
      filter: [
        "drop-shadow(0 0 2px rgba(255,192,129,0.2))",
        "drop-shadow(0 0 10px rgba(255,192,129,0.7))",
        "drop-shadow(0 0 2px rgba(255,192,129,0.2))"
      ],
      transition: {
        repeat: Infinity,
        duration: 2,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="hidden md:flex w-[220px] md:w-[64px] lg:w-[220px] shrink-0 bg-surface-low border-r border-border flex-col py-4 overflow-y-auto z-20 transition-all duration-300 select-none">
      <div className="px-4 pb-3.5 border-b border-border mb-2.5 md:px-0 md:text-center lg:px-4 lg:text-left">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="font-anton text-xl text-primary tracking-[3px]"
        >
          <span className="md:hidden lg:inline">ZEN_OS</span>
          <span className="hidden md:inline lg:hidden">Z</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="font-mono text-[9px] text-text3 tracking-[1px] mt-px md:hidden lg:block"
        >
          POWERED BY DANTE
        </motion.div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-2.5 mb-3.5 md:px-1.5 lg:px-2.5"
      >
        <div className="font-mono text-[9px] text-text3 uppercase tracking-[1.5px] px-1.5 mb-1 md:hidden lg:block">Views</div>
        
        {views.map(v => (
          <motion.button 
            key={v.id} 
            variants={navItemVariants}
            whileTap={shouldReduce ? undefined : { scale: 0.98 }}
            onClick={() => updateState({ view: v.id })} 
            className={`nav-item relative overflow-hidden group flex items-center gap-2 px-2 py-2.5 rounded-none md:justify-center lg:justify-start ${state.view === v.id ? 'text-primary border-l-0!' : ''}`}
          >
            {state.view === v.id && !shouldReduce && (
              <motion.div 
                layoutId="sidebar-highlight"
                className="absolute inset-x-0 inset-y-0 md:left-0 md:right-auto md:w-[3px] lg:inset-0 lg:w-full bg-primary-dim lg:border-l-[3px] border-primary pointer-events-none z-0"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            {state.view === v.id && shouldReduce && (
              <div className="absolute inset-x-0 inset-y-0 md:left-0 md:right-auto md:w-[3px] lg:inset-0 lg:w-full bg-primary-dim lg:border-l-[3px] border-primary pointer-events-none z-0" />
            )}
            <span className="material-symbols-outlined text-[17px] relative z-10">{v.icon}</span> 
            <span className="relative z-10 md:hidden lg:inline">{v.label}</span>
            
            {/* Tablet mode Hover Tooltip */}
            <div className="absolute left-[54px] top-1/2 -translate-y-1/2 bg-surface-high border border-border px-2 py-1 text-[10px] text-primary font-mono tracking-wider uppercase opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap pointer-events-none md:block lg:hidden rounded-none shadow-lg">
              {v.label}
            </div>
          </motion.button>
        ))}

        <motion.button 
          variants={navItemVariants}
          whileTap={shouldReduce ? undefined : { scale: 0.98 }}
          onClick={() => updateState({ view: 'dante' })} 
          className={`nav-item mt-1.5 border-t border-border pt-2.5 relative overflow-hidden group flex items-center gap-2 px-2 py-2.5 rounded-none md:justify-center lg:justify-start ${state.view === 'dante' ? 'text-primary' : ''}`}
        >
          {state.view === 'dante' && !shouldReduce && (
            <motion.div 
              layoutId="sidebar-highlight"
              className="absolute inset-x-0 inset-y-0 md:left-0 md:right-auto md:w-[3px] lg:inset-0 lg:w-full bg-primary-dim lg:border-l-[3px] border-primary pointer-events-none z-0"
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
            />
          )}
          {state.view === 'dante' && shouldReduce && (
            <div className="absolute inset-x-0 inset-y-0 md:left-0 md:right-auto md:w-[3px] lg:inset-0 lg:w-full bg-primary-dim lg:border-l-[3px] border-primary pointer-events-none z-0" />
          )}
          <motion.span 
            variants={shouldReduce ? undefined : danteGlowVariants}
            animate="animate"
            className="material-symbols-outlined text-[17px] text-primary relative z-10"
          >
            psychology
          </motion.span>
          <span className="text-primary relative z-10 md:hidden lg:inline">Dante AI</span>

          {/* Tablet mode Hover Tooltip */}
          <div className="absolute left-[54px] top-1/2 -translate-y-1/2 bg-surface-high border border-border px-2 py-1 text-[10px] text-primary font-mono tracking-wider uppercase opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap pointer-events-none md:block lg:hidden rounded-none shadow-lg">
            Dante AI
          </div>
        </motion.button>
      </motion.div>

      {/* Hide entire categories section on tablet */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="px-2.5 mb-3.5 md:hidden lg:block"
      >
        <div className="font-mono text-[9px] text-text3 uppercase tracking-[1.5px] px-1.5 mb-1">Categories</div>
        {state.categories.map(c => (
          <motion.button 
            key={c.id} 
            variants={navItemVariants}
            whileTap={shouldReduce ? undefined : { scale: 0.98 }}
            onClick={() => updateState({ filterCat: state.filterCat === c.id ? null : c.id, view: 'dashboard' })} 
            className={`nav-item relative overflow-hidden ${state.filterCat === c.id ? 'text-primary font-bold' : ''}`}
          >
            {state.filterCat === c.id && !shouldReduce && (
              <motion.div 
                layoutId="sidebar-highlight-cat"
                className="absolute inset-0 bg-primary-dim border-l-[3px] border-primary pointer-events-none z-0"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            {state.filterCat === c.id && shouldReduce && (
              <div className="absolute inset-0 bg-primary-dim border-l-[3px] border-primary pointer-events-none z-0" />
            )}
            <span className="w-1.5 h-1.5 rounded-full shrink-0 relative z-10" style={{ background: getCatColor(c.id, state.theme) }} />
            <span className="flex-1 truncate relative z-10">{c.label}</span>
            <span className="ml-auto text-[10px] text-text3 bg-surface-highest px-1.5 py-[1px] font-mono relative z-10">
              {state.tasks.filter(t => t.cat === c.id).length}
            </span>
          </motion.button>
        ))}
        
        <motion.button 
          variants={navItemVariants}
          whileTap={shouldReduce ? undefined : { scale: 0.98 }}
          onClick={() => setShowModal('addCategory')} 
          className="nav-item text-text3 mt-1"
        >
          <span className="material-symbols-outlined text-[17px]">add</span> New category
        </motion.button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-auto px-4 pt-3 border-t border-border flex flex-col gap-3.5 md:px-1.5 lg:px-4"
      >
        {/* Hide reminders on tablet */}
        <div className="md:hidden lg:block">
          <div className="font-mono text-[9px] text-text3 uppercase tracking-[1.5px] mb-1.5">Reminders</div>
          {upcoming.length ? upcoming.map(t => (
            <div key={t.id} className="flex items-center gap-1.5 py-1 text-[11px] text-text2 border-b border-border last:border-b-0">
              <span className="material-symbols-outlined text-[13px] text-amber">alarm</span>
              <div className="flex-1 min-w-0">
                <div className="truncate">{t.title}</div>
                <div className="text-[9px] text-text3 font-mono">{fmtDateTime(t.reminder)}</div>
              </div>
            </div>
          )) : <div className="text-[10px] text-text3 font-mono">No upcoming</div>}
        </div>

        {/* User profile & logout session */}
        {user && (
          <div className="pt-3.5 border-t border-border/60 flex flex-col gap-2 md:items-center lg:items-stretch">
            <div className="flex items-center gap-2 relative group cursor-pointer w-full md:justify-center lg:justify-start">
              <img 
                src={user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'} 
                alt={user.user_metadata?.full_name || 'User'} 
                className="w-7 h-7 border border-primary shrink-0 grayscale hover:grayscale-0 transition-all rounded-none object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0 text-left md:hidden lg:block">
                <div className="text-[11px] font-mono text-text font-bold truncate leading-tight">
                  {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Operator'}
                </div>
                <div className="text-[8px] font-mono text-text3 truncate tracking-wide leading-none uppercase">
                  ONLINE // STABLE
                </div>
              </div>

              {/* Tablet mode Hover Tooltip for operator statistics */}
              <div className="absolute left-[44px] top-1/2 -translate-y-1/2 bg-surface-high border border-border px-2 py-1 text-[10px] text-primary font-mono tracking-wider uppercase opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap pointer-events-none md:block lg:hidden rounded-none shadow-lg">
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Operator'} (ONLINE)
              </div>
            </div>
            
            <button
              onClick={() => {
                logOut();
              }}
              className="w-full py-1.5 bg-surface-mid border border-border hover:border-red-500/50 text-[#ff7171] hover:bg-red-500/5 hover:text-red-400 font-mono text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 rounded-none relative group"
            >
              <span className="material-symbols-outlined text-[12px]">logout</span>
              <span className="md:hidden lg:inline">Disconnect Session</span>

              {/* Tablet mode Hover Tooltip for disconnect button */}
              <div className="absolute left-[44px] top-1/2 -translate-y-1/2 bg-surface-high border border-[#ff7171]/50 px-2 py-1 text-[10px] text-[#ff7171] font-mono tracking-wider uppercase opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 whitespace-nowrap pointer-events-none md:block lg:hidden rounded-none shadow-lg">
                DISCONNECT SESSION
              </div>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
