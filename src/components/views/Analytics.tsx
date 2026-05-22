"use client";

import { useEffect, useState } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring, animate } from 'motion/react';
import { useZenos } from '../../context/ZenosContext';

// High-performance React spring count-up helper
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness: 90, damping: 14 });

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

export default function Analytics() {
  const { state } = useZenos();
  const shouldReduce = useReducedMotion();
  const { tasks, completionLog } = state;

  const done = tasks.filter(t => t.status === 'done').length;
  const prog = tasks.filter(t => t.status === 'inprogress').length;
  const todo = tasks.filter(t => t.status === 'todo').length;
  const total = tasks.length || 1;

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate completion log values for past 7 days
  const weekCounts = days.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    return completionLog.filter(l => l === ds).length;
  });

  const maxW = Math.max(...weekCounts, 1);

  // Consecutive days completion streak calculation
  const streakDays = new Set(completionLog);
  let streak = 0;
  const todayVal = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(todayVal);
    d.setDate(d.getDate() - i);
    if (streakDays.has(d.toISOString().split('T')[0])) {
      streak++;
    } else {
      break;
    }
  }

  const catStats = state.categories.map(c => ({
    ...c,
    count: tasks.filter(t => t.cat === c.id).length,
  })).filter(c => c.count > 0);

  const barVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: (h: number) => ({
      height: `${h}px`,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      }
    })
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.35, ease: "easeOut" } 
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4"
    >
      {/* Weekly completions bar chart */}
      <motion.div variants={cardVariants} className="bg-surface-low border border-border p-4">
        <div className="font-mono text-[10px] text-text3 uppercase tracking-wide mb-3.5">Weekly Completions</div>
        <div className="flex items-end gap-1.5 h-20">
          {weekCounts.map((v, i) => {
            const calculatedHeight = (v / maxW) * 60;
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="font-mono text-[9px] text-primary">
                  {shouldReduce ? v : <AnimatedNumber value={v} />}
                </span>
                <div className="w-full h-[60px] flex items-end justify-center">
                  <motion.div 
                    custom={calculatedHeight}
                    variants={barVariants}
                    className="w-full bg-primary hover:brightness-125 transition-all min-h-[2px]" 
                  />
                </div>
                <span className="font-mono text-[9px] text-text3">{days[i]}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Category breakdown */}
      <motion.div variants={cardVariants} className="bg-surface-low border border-border p-4">
        <div className="font-mono text-[10px] text-text3 uppercase tracking-wide mb-3.5">By Category</div>
        <div className="flex flex-col gap-1.5">
          {catStats.map(c => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-[11px] flex-1">{c.label}</span>
              <span className="font-mono text-[10px] text-text3">{c.count}</span>
              <div className="w-16 h-[3px] bg-surface-high overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.count / total) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full" 
                  style={{ background: c.color }} 
                />
              </div>
            </div>
          ))}
          {catStats.length === 0 && <div className="text-[11px] text-text3 font-mono">No data yet</div>}
        </div>
      </motion.div>

      {/* Status breakdown */}
      <motion.div variants={cardVariants} className="bg-surface-low border border-border p-4">
        <div className="font-mono text-[10px] text-text3 uppercase tracking-wide mb-3.5">Status Breakdown</div>
        {[
          { label: 'Done', val: done, color: 'var(--green)' },
          { label: 'In Progress', val: prog, color: 'var(--primary)' },
          { label: 'To Do', val: todo, color: 'var(--text3)' },
        ].map((s, idx) => (
          <div key={s.label} className="mb-2.5">
            <div className="flex justify-between font-mono text-[10px] mb-1">
              <span className="text-text2">{s.label}</span>
              <span style={{ color: s.color }}>
                {shouldReduce ? s.val : <AnimatedNumber value={s.val} />} / {tasks.length}
              </span>
            </div>
            <div className="h-[3px] bg-surface-high overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(s.val / total) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.1 }}
                className="h-full" 
                style={{ background: s.color }} 
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* Streak */}
      <motion.div variants={cardVariants} className="bg-surface-low border border-border p-4 flex flex-col items-center justify-center">
        <div className="font-mono text-[10px] text-text3 uppercase tracking-wide mb-3">Completion Streak</div>
        <motion.div 
          animate={shouldReduce ? {} : { 
            scale: [1, 1.2, 1],
            rotate: [0, -10, 10, 0]
          }}
          transition={{ duration: 0.6, ease: "easeInOut", delay: 0.3 }}
          className="text-4xl mb-1"
        >
          🔥
        </motion.div>
        <div className="font-anton text-[48px] text-primary leading-none tracking-wide">
          {shouldReduce ? streak : <AnimatedNumber value={streak} />}
        </div>
        <div className="font-mono text-[10px] text-text3 mt-1.5 uppercase tracking-wide">Days in a row</div>
      </motion.div>
    </motion.div>
  );
}
