"use client";

import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import { useZenos } from '../../context/ZenosContext';
import TaskCard from '../ui/TaskCard';

export default function Kanban() {
  const { state } = useZenos();
  const shouldReduce = useReducedMotion();
  const tasks = state.filterCat ? state.tasks.filter(t => t.cat === state.filterCat) : state.tasks;
  
  const cols = [
    { key: 'todo', label: 'To Do', color: 'var(--text3)' },
    { key: 'inprogress', label: 'In Progress', color: 'var(--primary)' },
    { key: 'done', label: 'Done', color: 'var(--green)' },
  ];

  const columnVariants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.9 },
    visible: (index: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: shouldReduce ? 0 : index * 0.1,
        duration: 0.35,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 h-full">
      {cols.map((col, colIndex) => {
        const colTasks = tasks.filter(t => t.status === col.key);
        
        return (
          <motion.div 
            key={col.key} 
            custom={colIndex}
            variants={columnVariants}
            initial="hidden"
            animate="visible"
            className="bg-surface-low border border-border p-3 min-h-[300px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border">
              <span className="text-[11px] font-bold uppercase tracking-wide font-mono" style={{ color: col.color }}>{col.label}</span>
              <span className="text-[10px] font-mono bg-surface-highest px-1.5 py-px text-text3">{colTasks.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {colTasks.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {colTasks.map((t, cardIndex) => (
                    <TaskCard key={t.id} task={t} index={cardIndex} />
                  ))}
                </AnimatePresence>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  className="text-center py-6 text-text3 text-[11px] font-mono opacity-50"
                >
                  Empty
                </motion.div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
