"use client";

import { motion, useReducedMotion } from 'motion/react';
import { Task } from '../../types';
import { useZenos } from '../../context/ZenosContext';
import { fmtDate, fmtDateTime } from '../../lib/utils';

interface TaskCardProps {
  task: Task;
  index?: number;
  key?: any;
}

export default function TaskCard({ task, index = 0 }: TaskCardProps) {
  const { state, toggleTaskDone, deleteTask, setEditTaskId, setShowModal } = useZenos();
  const shouldReduce = useReducedMotion();
  const cat = state.categories.find(c => c.id === task.cat) || { label: 'Unknown', color: '#888' };

  const getTagClass = (id: string) => {
    const map: Record<string, string> = {
      radio: 'bg-tertiary/10 text-tertiary border-tertiary/25',
      research: 'bg-secondary/10 text-secondary border-secondary/25',
      application: 'bg-amber/10 text-amber border-amber/25',
      other: 'bg-text3/10 text-text2 border-border/70',
    };
    return map[id] || 'bg-primary/10 text-primary border-primary/25';
  };

  const slideInVariants = {
    hidden: { opacity: 0, x: -24 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.35,
        ease: "easeOut",
        delay: shouldReduce ? 0 : index * 0.06
      }
    },
    exit: { 
      opacity: 0, 
      x: -60, 
      height: 0,
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: 0,
      marginBottom: 0,
      transition: { duration: 0.25, ease: "easeInOut" }
    }
  };

  return (
    <motion.div 
      layout="position"
      variants={slideInVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={shouldReduce ? undefined : { 
        y: -4, 
        scale: 1.03,
        rotate: -0.5,
        borderColor: "var(--primary)",
        boxShadow: "0 0 18px var(--primary-dim)",
        transition: { type: "spring", stiffness: 450, damping: 14 } 
      }}
      whileTap={shouldReduce ? undefined : { scale: 0.94, rotate: 0.5 }}
      className="task-card overflow-hidden" 
      onClick={() => { setEditTaskId(task.id); setShowModal('editTask'); }}
    >
      <div className="flex items-start gap-2.5">
        <motion.div
          whileTap={shouldReduce ? undefined : { scale: 0.75 }}
          animate={{ 
            scale: task.status === 'done' ? [1, 1.35, 1] : 1,
            backgroundColor: task.status === 'done' ? "var(--secondary)" : "rgba(0,0,0,0)"
          }}
          transition={{ type: "spring", stiffness: 500, damping: 12 }}
          className={`w-4 h-4 border-[1.5px] border-border2 shrink-0 mt-0.5 cursor-pointer flex items-center justify-center transition-all hover:border-secondary ${task.status === 'done' ? 'border-secondary' : ''}`}
          onClick={(e) => { 
            e.stopPropagation(); 
            toggleTaskDone(task.id); 
          }}
        >
          {task.status === 'done' && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05, type: "spring", stiffness: 500 }}
              className="material-symbols-outlined text-[11px] text-[#131316]" 
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </motion.span>
          )}
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className={`text-[13px] font-bold leading-tight transition-all duration-300 ${task.status === 'done' ? 'line-through text-text3' : 'text-text'}`}>{task.title}</div>
          <div className="flex gap-1.5 items-center mt-1.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 font-medium font-mono tracking-wide border ${getTagClass(task.cat)}`}>{cat.label}</span>
            {task.date && <span className="text-[10px] text-text3 flex items-center gap-0.5 font-mono"><span className="material-symbols-outlined text-[11px]">calendar_today</span>{fmtDate(task.date)}</span>}
            {task.reminder && <span className="text-[10px] text-text3 flex items-center gap-0.5 font-mono"><span className="material-symbols-outlined text-[11px]">alarm</span>{fmtDateTime(task.reminder)}</span>}
          </div>
          {task.note && <div className="text-[11px] text-text3 mt-1 italic">{task.note}</div>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[10px] font-mono text-text3">{task.progress}%</span>
          <button className="text-text3 hover:text-error p-0.5 bg-transparent border-none cursor-pointer" onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}>
            <span className="material-symbols-outlined text-[15px]">delete</span>
          </button>
        </div>
      </div>
      
      {/* Progress Bars: Animate width on mount with shimmer glint */}
      <div className="h-[3px] bg-surface-high mt-2 overflow-hidden relative">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${task.progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: shouldReduce ? 0 : 0.15 }}
          className="h-full bg-gradient-to-r from-primary to-secondary relative"
        >
          {!shouldReduce && (
            <motion.div
              animate={{ x: ["-100%", "150%"] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
