"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useZenos } from "../../context/ZenosContext";
import { VaultItem } from "../../types";
import { fmtDate } from "../../lib/utils";

export default function Vault() {
  const { state, addVaultItem, deleteVaultItem } = useZenos();
  const shouldReduce = useReducedMotion();
  const [linkForm, setLinkForm] = useState({ name: '', url: '', detail: '' });
  const [showAdd, setShowAdd] = useState(false);

  const deleteItem = async (id: string) => {
    await deleteVaultItem(id);
  };

  const addLink = async () => {
    if (!linkForm.name || !linkForm.url) return;
    
    await addVaultItem({
      type: 'link',
      name: linkForm.name,
      url: linkForm.url,
      detail: linkForm.detail
    });
    
    setLinkForm({ name: '', url: '', detail: '' });
    setShowAdd(false);
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.85 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", stiffness: 250, damping: 20 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      height: 0,
      padding: 0,
      margin: 0,
      opacityTransition: { duration: 0.15 },
      transition: { duration: 0.25, ease: "easeInOut" }
    }
  };

  const formVariants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    visible: { 
      opacity: 1, 
      height: "auto", 
      marginBottom: 16,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      height: 0, 
      marginBottom: 0,
      transition: { duration: 0.25, ease: "easeInOut" }
    }
  };

  return (
    <>
      <div className="section-header mb-4">
        <div className="section-title">Vault — {state.vault.length} items</div>
        <motion.button
          whileHover={shouldReduce ? undefined : { scale: 1.03 }}
          whileTap={shouldReduce ? undefined : { scale: 0.98 }}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-[#2c1600] text-[10px] font-mono font-bold tracking-wide uppercase hover:brightness-110 cursor-pointer border-none"
          onClick={() => setShowAdd(!showAdd)}
        >
          <span className="material-symbols-outlined text-[14px]">add_link</span> Add Link
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-surface-low border border-border p-4 overflow-hidden"
          >
            <div className="font-mono text-[10px] text-text3 uppercase tracking-wide mb-3">New Link</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input className="form-input" placeholder="Name" value={linkForm.name} onChange={e => setLinkForm({...linkForm, name: e.target.value})} />
              <input className="form-input" placeholder="URL (https://...)" value={linkForm.url} onChange={e => setLinkForm({...linkForm, url: e.target.value})} />
              <input className="form-input" placeholder="Note (optional)" value={linkForm.detail} onChange={e => setLinkForm({...linkForm, detail: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button className="btn border border-border text-text2 hover:bg-surface-high cursor-pointer" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn bg-primary text-[#2c1600] hover:brightness-110 cursor-pointer" onClick={addLink}>Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {state.vault.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-center py-12 text-text3 text-[11px] font-mono"
        >
          <span className="material-symbols-outlined text-[32px] block mb-2.5 opacity-20 mx-auto">folder_open</span>
          Vault is empty — add links or files
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <AnimatePresence mode="popLayout">
          {state.vault.map(item => (
            <motion.div 
              key={item.id} 
              variants={cardVariants}
              whileHover={shouldReduce ? undefined : { 
                y: -2,
                borderColor: "var(--border2)",
                boxShadow: "0 4px 12px rgba(165,231,255,0.1)",
                transition: { duration: 0.2 }
              }}
              layout="position"
              className="bg-surface-low border border-border p-3.5 flex items-start gap-2.5 relative overflow-hidden"
            >
              <div className={`w-9 h-9 flex items-center justify-center border shrink-0 ${item.type === 'link' ? 'bg-secondary-dim border-[rgba(165,231,255,0.25)] text-secondary' : 'bg-primary-dim border-border2 text-primary'}`}>
                <span className="material-symbols-outlined text-[18px]">
                  {item.type === 'link' ? 'link' : 'description'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold mb-0.5 truncate">{item.name}</div>
                {item.detail && <div className="text-[11px] text-text3 mt-0.5">{item.detail}</div>}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-secondary flex items-center gap-0.5 mt-1 hover:underline" onClick={e => e.stopPropagation()}>
                    <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                    {item.url.replace(/^https?:\/\//, '').slice(0, 40)}
                  </a>
                )}
                <div className="font-mono text-[9px] text-text3 mt-1.5">{fmtDate(item.addedAt.split('T')[0])}</div>
              </div>
              <button className="absolute top-2 right-2 text-text3 hover:text-error bg-transparent border-none cursor-pointer p-0.5" onClick={() => deleteItem(item.id)}>
                <span className="material-symbols-outlined text-[15px]">delete</span>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
