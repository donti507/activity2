"use client";

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useZenos } from '../../context/ZenosContext';

export default function Calendar() {
  const { state, updateState, setShowModal, googleEvents, loadingEvents } = useZenos();
  const shouldReduce = useReducedMotion();
  const { calYear, calMonth, tasks } = state;
  const [direction, setDirection] = useState(1); // 1 = right (next), -1 = left (prev)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const prevMonth = () => {
    setDirection(-1);
    if (calMonth === 0) {
      updateState({ calMonth: 11, calYear: calYear - 1 });
    } else {
      updateState({ calMonth: calMonth - 1 });
    }
  };

  const nextMonth = () => {
    setDirection(1);
    if (calMonth === 11) {
      updateState({ calMonth: 0, calYear: calYear + 1 });
    } else {
      updateState({ calMonth: calMonth + 1 });
    }
  };

  const cells: { day: number; month: 'prev' | 'cur' | 'next'; dateStr: string }[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const m = calMonth === 0 ? 11 : calMonth - 1;
    const y = calMonth === 0 ? calYear - 1 : calYear;
    cells.push({ 
      day: d, 
      month: 'prev', 
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` 
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ 
      day: d, 
      month: 'cur', 
      dateStr: `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` 
    });
  }

  let next = 1;
  while (cells.length % 7 !== 0) {
    const m = calMonth === 11 ? 0 : calMonth + 1;
    const y = calMonth === 11 ? calYear + 1 : calYear;
    cells.push({ 
      day: next++, 
      month: 'next', 
      dateStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(next - 1).padStart(2, '0')}` 
    });
  }

  const getTasksForDate = (dateStr: string) => tasks.filter(t => t.date === dateStr);

  const getGoogleEventsForDate = (dateStr: string) => {
    return (googleEvents || []).filter(ev => {
      const startStr = ev.start?.dateTime || ev.start?.date || '';
      return startStr.startsWith(dateStr);
    });
  };

  // Formatter for calendar events details
  function formatGoogleTime(startStr?: { dateTime?: string; date?: string }) {
    if (!startStr) return '';
    const dateObj = new Date(startStr.dateTime || startStr.date || '');
    return dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' + dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  // Slice chronological upcoming 7 days details
  const now = new Date();
  const maxForecastDate = new Date();
  maxForecastDate.setDate(now.getDate() + 7);

  const upcoming7DaysEvents = (googleEvents || [])
    .filter(ev => {
      const startStr = ev.start?.dateTime || ev.start?.date;
      if (!startStr) return false;
      const start = new Date(startStr);
      return start >= now && start <= maxForecastDate;
    })
    .sort((a, b) => {
      const aStart = new Date(a.start?.dateTime || a.start?.date || '');
      const bStart = new Date(b.start?.dateTime || b.start?.date || '');
      return aStart.getTime() - bStart.getTime();
    });

  const gridVariants = {
    initial: (dir: number) => ({
      x: shouldReduce ? 0 : dir * 150,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 220, damping: 25 },
        opacity: { duration: 0.25 }
      }
    },
    exit: (dir: number) => ({
      x: shouldReduce ? 0 : -dir * 150,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 220, damping: 25 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const cellVariants = {
    hidden: { opacity: 0, y: shouldReduce ? 0 : 8 },
    visible: (i: number) => {
      const row = Math.floor(i / 7);
      return {
        opacity: 1,
        y: 0,
        transition: {
          delay: shouldReduce ? 0 : row * 0.05 + (i % 7) * 0.006,
          duration: 0.25,
          ease: "easeOut"
        }
      };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
      {/* Monthly Grid Section */}
      <div className="lg:col-span-8 xl:col-span-9 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-3.5">
          <motion.button 
            whileTap={shouldReduce ? undefined : { scale: 0.9 }}
            className="bg-transparent border border-border text-text2 px-2.5 py-1 cursor-pointer text-[12px] font-mono hover:bg-surface-high hover:text-text" 
            onClick={prevMonth}
          >
            ←
          </motion.button>
          <motion.span 
            key={`${calMonth}-${calYear}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono text-[13px] text-text uppercase tracking-wider"
          >
            {monthNames[calMonth]} {calYear}
          </motion.span>
          <motion.button 
            whileTap={shouldReduce ? undefined : { scale: 0.9 }}
            className="bg-transparent border border-border text-text2 px-2.5 py-1 cursor-pointer text-[12px] font-mono hover:bg-surface-high hover:text-text" 
            onClick={nextMonth}
          >
            →
          </motion.button>
        </div>

        <div className="overflow-hidden p-0.5">
          <div className="grid grid-cols-7 gap-[3px] mb-1">
            {dayNames.map(d => (
              <div key={d} className="text-center text-[9px] text-text3 py-1 uppercase tracking-wide font-mono">{d}</div>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${calYear}-${calMonth}`}
              custom={direction}
              variants={gridVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid grid-cols-7 gap-[3px]"
            >
              {cells.map((cell, i) => {
                const cellTasks = getTasksForDate(cell.dateStr);
                const cellGoogleEvents = getGoogleEventsForDate(cell.dateStr);
                const isToday = cell.dateStr === todayStr && cell.month === 'cur';
                
                return (
                  <motion.div
                    key={cell.dateStr + '-' + i}
                    custom={i}
                    variants={cellVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={shouldReduce ? undefined : { 
                      borderColor: "var(--border2)",
                      scale: 1.02,
                      zIndex: 10,
                      transition: { duration: 0.15 } 
                    }}
                    onClick={() => {
                      updateState({ selectedDate: cell.dateStr });
                      setShowModal('addTask');
                    }}
                    className={`bg-surface-low border border-border p-1.5 min-h-[72px] cursor-pointer transition-colors flex flex-col justify-between
                      ${isToday ? 'border-primary bg-primary-dim' : ''}
                      ${cellTasks.length > 0 && !isToday ? 'border-l-2 border-l-[#ffc081]' : ''}
                      ${cellGoogleEvents.length > 0 && !isToday ? 'border-r-2 border-r-[#a5e7ff]' : ''}
                      ${cell.month !== 'cur' ? 'opacity-25' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono mb-0.5 ${isToday ? 'text-primary font-bold' : 'text-text2'}`}>{cell.day}</span>
                      <div className="flex gap-1">
                        {cellTasks.slice(0, 3).map(t => (
                          <div 
                            key={t.id} 
                            className="w-[4px] h-[4px] rounded-full my-px shrink-0" 
                            style={{ background: state.categories.find(c => c.id === t.cat)?.color || 'var(--primary)' }} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Google Events overlaid in blue secondary strips */}
                    <div className="mt-1.5 space-y-0.5 max-w-full">
                      {cellGoogleEvents.slice(0, 2).map(ev => (
                        <div 
                          key={ev.id} 
                          className="text-[#a5e7ff] text-[7.5px] uppercase tracking-tight leading-none truncate bg-[#a5e7ff]/8 px-1 py-[1.5px] border-l border-[#a5e7ff] rounded-none max-w-full font-mono text-left"
                          title={ev.summary || '(Google Event)'}
                        >
                          {ev.summary || '(No Subject)'}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right panel: Upcoming 7 Days forecast list */}
      <div className="lg:col-span-4 xl:col-span-3 border border-border bg-surface-low p-4 flex flex-col select-none max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-2.5 mb-4 shrink-0">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-primary uppercase tracking-wider font-bold">
            <span className="material-symbols-outlined text-[15px] text-[#a5e7ff]">event_upcoming</span>
            Google Flow Forecast
          </div>
          {loadingEvents && (
            <span className="animate-spin text-xs">⏳</span>
          )}
        </div>

        <div className="font-mono text-[9px] text-text3 uppercase mb-2">Upcoming 7 Days</div>
        
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {upcoming7DaysEvents.length > 0 ? (
            upcoming7DaysEvents.map(ev => {
              const meetLink = ev.hangoutLink || ev.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
              return (
                <div key={ev.id} className="bg-surface-high border border-border p-3 flex flex-col justify-between hover:border-[#a5e7ff]/40 transition-colors">
                  <div>
                    <div className="font-mono text-[9px] text-[#a5e7ff] mb-1 font-semibold">
                      {formatGoogleTime(ev.start)}
                    </div>
                    <div className="text-[11px] font-bold text-text mb-2 tracking-wide leading-snug">
                      {ev.summary || '(No Subject)'}
                    </div>
                  </div>
                  
                  {meetLink && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <a 
                        href={meetLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="px-2.5 py-1.5 bg-[#a5e7ff] text-[#0a161c] text-[8.5px] font-mono font-bold uppercase transition-all duration-150 hover:brightness-110 active:scale-[0.98] select-none rounded-none inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[11px]">video_call</span>
                        Join Meet
                      </a>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 font-mono text-[10px] text-text3 uppercase border border-dashed border-border/50">
              No upcoming events within 7 days
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
