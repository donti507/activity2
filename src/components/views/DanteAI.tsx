"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useZenos } from "../../context/ZenosContext";
import { getCatColor } from "../../lib/utils";
import { Task, Meeting } from "../../types";

export default function DanteAI() {
  const { 
    state, 
    updateState, 
    addTask, 
    toggleTaskDone, 
    saveDanteMessage, 
    clearDanteHistory 
  } = useZenos();

  const shouldReduce = useReducedMotion();
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Voice Input (SpeechToText) states
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Voice Output (TextToSpeech) states
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [activeSpeechUtterance, setActiveSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);
  const [spokenSentenceIndex, setSpokenSentenceIndex] = useState<number | null>(null);
  const [currentlySpeakingMessageTs, setCurrentlySpeakingMessageTs] = useState<number | null>(null);

  // Track dismissed/hidden action cards
  const [dismissedActions, setDismissedActions] = useState<Record<number, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("zenos_dismissed_actions");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    }
    return {};
  });

  const dismissActionCard = (ts: number) => {
    setDismissedActions(prev => {
      const updated = { ...prev, [ts]: true };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("zenos_dismissed_actions", JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const endRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => {
          setIsRecording(true);
        };

        rec.onresult = (e: any) => {
          const resultText = e.results[0][0].transcript;
          if (resultText) {
            setInput(prev => prev ? prev + " " + resultText : resultText);
          }
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser environment. Try Chrome or Safari.");
      return;
    }
    if (isRecording) {
      recognition.stop();
    } else {
      // Stop TTS if speaking
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      recognition.start();
    }
  };

  // Auto-scroll messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.danteHistory, streamingMessage, loading]);

  // Clean utterance when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text to Speech voice implementation with sentence-level tracking
  const speakResponse = (textToSpeak: string, msgTs: number) => {
    if (!isVoiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;

    // Clear previous speech
    window.speechSynthesis.cancel();

    // Clean out json codeblock if any is present
    const cleanText = textToSpeak.replace(/```json[\s\S]*?```/g, "").trim();
    if (!cleanText) return;

    // Break up into sentences
    const sentences = cleanText.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleanText];
    
    setCurrentlySpeakingMessageTs(msgTs);
    setSpokenSentenceIndex(0);

    let currentIndex = 0;

    const speakNextSentence = () => {
      if (currentIndex >= sentences.length) {
        setSpokenSentenceIndex(null);
        setCurrentlySpeakingMessageTs(null);
        return;
      }

      const sentence = sentences[currentIndex].trim();
      if (!sentence) {
        currentIndex++;
        speakNextSentence();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(sentence);
      
      // Select appropriate English voice
      const voices = window.speechSynthesis.getVoices();
      const backupVoice = voices.find(v => v.lang.startsWith("en-US")) || voices[0];
      if (backupVoice) {
        utterance.voice = backupVoice;
      }
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpokenSentenceIndex(currentIndex);
      };

      utterance.onend = () => {
        currentIndex++;
        speakNextSentence();
      };

      utterance.onerror = () => {
        currentIndex++;
        speakNextSentence();
      };

      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  };

  const handleSend = async () => {
    if ((!input.trim() && !streamingMessage) || loading) return;

    // Cancel active Speech
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const userQuery = input.trim();
    setInput("");
    setLoading(true);

    // Save user message in local structure & Supabase memory
    await saveDanteMessage("user", userQuery);

    // Formulate context shape
    const contextBody = {
      tasks: state.tasks,
      meetings: state.meetings,
      googleEvents: state.googleEvents,
      vault: state.vault,
      categories: state.categories,
      streak: 5, // Custom streak telemetry
      completionRate: Math.round(
        (state.tasks.filter(t => t.status === "done").length / Math.max(1, state.tasks.length)) * 100
      ),
      productivityScore: 88, // Custom high performance metrics
    };

    setStreamingMessage("");

    try {
      // Re-fetch history from state to ensure recent messages are present
      const refreshedHistory = [
        ...state.danteHistory,
        { role: "user" as const, content: userQuery, ts: Date.now() }
      ];

      const response = await fetch("/api/dante", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: refreshedHistory,
          context: contextBody
        })
      });

      if (!response.ok) {
        throw new Error("Synaptic connection to Dante AI was rejected by the server.");
      }

      if (!response.body) {
        throw new Error("Stream response body is empty.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkStr = decoder.decode(value);
          buffer += chunkStr;

          const lines = buffer.split("\n");
          // Keep last incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith("data: ")) {
              const dataValue = cleanLine.substring(6).trim();
              if (dataValue === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataValue);
                if (parsed.text) {
                  setStreamingMessage(prev => prev + parsed.text);
                }
              } catch (e) {
                // partial JSON packet
              }
            }
          }
        }
      }

    } catch (err: any) {
      console.error(err);
      setStreamingMessage(`**Fatal Synaptic Shutdown**: ${err.message || "Unresolvable AI Gateway connection issue."}`);
    } finally {
      setLoading(false);
    }
  };

  // Monitor when stream ends to persist AI answer and parse JSON action
  useEffect(() => {
    if (!loading && streamingMessage) {
      const finalMessage = streamingMessage;
      setStreamingMessage("");

      // Persist Dante message in database-backed chat memory
      saveDanteMessage("assistant", finalMessage).then(() => {
        // Trigger voice output if enabled
        speakResponse(finalMessage, Date.now());

        // Parse quick actions inside completed response text
        const actionMatch = finalMessage.match(/```json\s*([\s\S]*?)\s*```/);
        if (actionMatch && actionMatch[1]) {
          try {
            const parsedAction = JSON.parse(actionMatch[1]);
            executeQuickAction(parsedAction);
          } catch (e) {
            console.error("Could not parse automatic helper dispatcher action:", e);
          }
        }
      });
    }
  }, [loading]);

  // Execute quick AI-triggered actions immediately inside context state
  const executeQuickAction = async (actionObj: { action: string; data: any; message?: string }) => {
    console.log("DANTE CHIEF-OF-STAFF IS EXECUTING ACTION:", actionObj);
    const { action, data } = actionObj;

    try {
      if (action === "create_task") {
        await addTask({
          title: data.title || "New Priory",
          cat: data.cat || "other",
          status: "todo",
          date: data.date || new Date().toISOString().split("T")[0],
          reminder: "",
          note: data.note || "Created by Dante Chief of Staff",
          progress: 0,
          steps: []
        });
      } else if (action === "toggle_task") {
        // Find task by title matching
        const inputTitle = data.title || "";
        const matchedTask = state.tasks.find(t => 
          t.title.toLowerCase().includes(inputTitle.toLowerCase())
        );
        if (matchedTask) {
          await toggleTaskDone(matchedTask.id);
        }
      } else if (action === "create_meeting") {
        const newM: Meeting = {
          id: "meet-" + Date.now(),
          personName: data.personName || "Client/Team",
          date: data.date || new Date().toISOString().split("T")[0],
          time: data.time || "10:00",
          subject: data.subject || "Alignedpriority syncing session",
          status: "upcoming",
          elapsedSeconds: 0,
          notes: "",
          createdAt: new Date().toISOString()
        };
        updateState({ meetings: [...(state.meetings || []), newM] });
      } else if (action === "switch_view") {
        updateState({ view: data.view || "dashboard" });
      }
    } catch (err) {
      console.error("Action execution failed:", err);
    }
  };

  // Helper to split message and render beautifully (filtering out JSON raw markdown blocks for users)
  const renderMessageContent = (m: { role: string; content: string; ts: number }) => {
    // Strip JSON block
    const isUser = m.role === "user";
    const cleanedContent = m.content.replace(/```json[\s\S]*?```/g, "").trim();

    // Check if there is an action to display as a gorgeous action badge:
    const actionMatch = m.content.match(/```json\s*([\s\S]*?)\s*```/);
    let parsedAction: any = null;
    if (actionMatch && actionMatch[1]) {
      try {
        parsedAction = JSON.parse(actionMatch[1]);
      } catch (e) {}
    }

    // Splitting text into sentences if speaking, so we highlight the spoken sentence!
    const speakTsMatch = currentlySpeakingMessageTs !== null && currentlySpeakingMessageTs === m.ts;
    const sentences = cleanedContent.match(/[^.!?]+[.!?]+(\s|$)/g) || [cleanedContent];

    return (
      <div className="flex flex-col gap-2">
        <div>
          {sentences.map((sentence, idx) => {
            const isSentenceSpoken = speakTsMatch && spokenSentenceIndex === idx;
            return (
              <span 
                key={idx}
                className={isSentenceSpoken ? "bg-primary-dim text-primary underline decoration-primary font-bold decoration-dotted transition-colors duration-200" : ""}
              >
                {sentence.split("**").map((part, pIdx) => {
                  if (pIdx % 2 === 1) {
                    return <strong key={pIdx} className="font-bold text-primary font-mono">{part}</strong>;
                  }
                  return part;
                })}
              </span>
            );
          })}
        </div>

        {/* Action card display */}
        {parsedAction && !dismissedActions[m.ts] && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2.5 p-3 bg-surface-high border-l-4 border-primary flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-border"
          >
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#a38d7a] flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] leading-none animate-ping text-primary">circle</span>
                Dante Dispatched Action
              </div>
              <div className="font-mono text-[12px] font-bold text-text mb-0.5">
                {parsedAction.action === "create_task" && `CREATE TASK: "${parsedAction.data?.title}"`}
                {parsedAction.action === "toggle_task" && `COMPLETE TASK: "${parsedAction.data?.title}"`}
                {parsedAction.action === "create_meeting" && `SCHEDULE MEET: "${parsedAction.data?.subject}"`}
                {parsedAction.action === "switch_view" && `NAVIGATE VIEW: "${parsedAction.data?.view}"`}
              </div>
              {parsedAction.message && (
                <div className="text-[11px] text-text3 italic">"{parsedAction.message}"</div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* VIEW RESEARCH category matching explorer button */}
              {(parsedAction.data?.cat === "research" || 
                (parsedAction.data?.title && String(parsedAction.data.title).toLowerCase().includes("research")) ||
                cleanedContent.toLowerCase().includes("research")) && (
                <button
                  onClick={() => updateState({ filterCat: "research", view: "dashboard" })}
                  className="px-2.5 py-1 bg-surface-mid hover:bg-primary/20 hover:text-primary border border-border hover:border-primary text-text font-mono text-[10px] font-bold tracking-wider uppercase transition-all rounded-[3px] select-none cursor-pointer active:scale-95 duration-100"
                >
                  VIEW RESEARCH
                </button>
              )}

              {/* DONE confirmation & dismissal trigger */}
              <button
                onClick={() => dismissActionCard(m.ts)}
                className="px-2.5 py-1 bg-primary/20 hover:bg-primary text-primary hover:text-[#1a0a00] border border-primary text-[10px] font-mono font-bold tracking-wider uppercase transition-all rounded-[3px] select-none cursor-pointer active:scale-95 duration-100"
              >
                DONE
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  const suggestions = ["Summarize my tasks", "What is my streak status?", "Schedule synchronization session tomorrow 4pm", "Add task polish design assets"];

  // Rendering streaming response without JSON showing
  const cleanStreamText = streamingMessage.replace(/```json[\s\S]*?```/g, "").trim();

  return (
    <div className="flex flex-col -m-4 md:-m-5 border border-border bg-bg" style={{ height: "calc(100vh - 56px)" }}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3 bg-surface-low shrink-0 select-none">
        
        {/* Amber geometric avatar */}
        <motion.div 
          animate={shouldReduce ? {} : { 
            scale: loading ? [1, 1.15, 1] : 1,
            rotate: loading ? [0, 45, 90, 180, 270, 360] : 0,
            borderRadius: ["0%", "10%", "25%", "10%", "0%"]
          }}
          transition={{ 
            duration: loading ? 3 : 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="w-9 h-9 border border-primary bg-primary-dim flex items-center justify-center relative rotate-45 shrink-0"
        >
          {/* Inner pulsating core */}
          <motion.div 
            animate={{ scale: [0.75, 1.15, 0.75] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute w-4 h-4 bg-primary rounded-none"
          />
        </motion.div>

        <div>
          <div className="font-anton text-[16px] tracking-widest text-primary">DANTE AI</div>
          <div className="font-mono text-[9px] text-text3 flex items-center gap-1.5">
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className={`w-1.5 h-1.5 rounded-full ${loading ? "bg-primary animate-ping" : "bg-green"}`}
            /> 
            {loading ? "Dante is thinking..." : "Dante Chief of Staff Active · Cloud Sync"}
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Speaker button */}
          <button 
            className={`btn px-2 py-1.5 font-mono text-[10px] font-bold uppercase transition-all flex items-center gap-1 rounded-[3px] border ${isVoiceEnabled ? "bg-primary/20 text-primary border-primary" : "bg-surface-mid border-border text-text3"}`}
            onClick={() => {
              const enabled = !isVoiceEnabled;
              setIsVoiceEnabled(enabled);
              if (!enabled && typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            title="Toggle speech voice output aloud"
          >
            <span className="material-symbols-outlined text-[15px] leading-none">
              {isVoiceEnabled ? "volume_up" : "volume_off"}
            </span>
            <span className="hidden md:inline">{isVoiceEnabled ? "TTS ON" : "TTS OFF"}</span>
          </button>

          {/* Clean conversation button */}
          <button 
            className="icon-btn" 
            onClick={() => {
              if (confirm("Purge conversation memory history?")) {
                clearDanteHistory();
              }
            }}
            title="Purge chat database history"
          >
            <span className="material-symbols-outlined text-[17px]">delete_sweep</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {state.danteHistory.length === 0 && !streamingMessage && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5 max-w-[85%]"
          >
            <div className="w-7 h-7 border border-primary text-primary flex items-center justify-center font-anton text-[10px] shrink-0 mt-0.5 uppercase">D</div>
            <div className="bg-surface-low border border-border p-3 text-[13px] leading-relaxed">
              Accept my respects. I am Dante, your intelligence chief-of-staff inside ZEN OS.<br/>
              I have scanned your calendars, upcoming priority events, categories, and complete task vaults.<br/><br/>
              Ask me to prioritize your load, schedule priority events, toggles tasks, or summarize your morning directly.
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {state.danteHistory.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <motion.div 
                key={m.ts + "-" + i} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2.5 max-w-[85%] ${isUser ? "self-end flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 flex items-center justify-center font-anton text-[10px] shrink-0 mt-0.5 border ${isUser ? "bg-surface-high border-border text-text2" : "border-primary bg-primary-dim text-primary"}`}>
                  {isUser ? "U" : "D"}
                </div>
                <div className={`p-3 text-[13px] leading-relaxed border flex flex-col gap-1 ${isUser ? "bg-primary-dim border-primary/20 text-text" : "bg-surface-low border-border text-text"}`}>
                  {renderMessageContent(m)}
                  
                  {/* Category Shortcut Link Launcher triggers */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-border/40 flex flex-wrap gap-1.5">
                      {state.categories.map(c => {
                        const lowerContent = m.content.toLowerCase();
                        const mentions = lowerContent.includes(c.label.toLowerCase()) || lowerContent.includes(c.id.toLowerCase());
                        if (!mentions) return null;
                        const cColor = getCatColor(c.id, state.theme);
                        return (
                          <button
                            key={c.id}
                            className="px-2 py-1 bg-surface-mid border text-[9px] font-mono font-bold tracking-wider cursor-pointer transition-all uppercase flex items-center gap-1 hover:brightness-110 active:scale-95 duration-100"
                            style={{ borderColor: cColor, color: cColor }}
                            onClick={() => updateState({ filterCat: c.id, view: "dashboard" })}
                          >
                            <span className="material-symbols-outlined text-[11px]">rocket_launch</span>
                            View {c.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Streaming text feedback */}
        {streamingMessage && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="w-7 h-7 border border-primary bg-primary-dim text-primary flex items-center justify-center font-anton text-[10px] shrink-0 mt-0.5">D</div>
            <div className="p-3 bg-surface-low border border-border text-[13px] leading-relaxed text-text">
              {cleanStreamText.split("**").map((part, pIdx) => {
                if (pIdx % 2 === 1) {
                  return <strong key={pIdx} className="font-bold text-primary font-mono">{part}</strong>;
                }
                return part;
              })}
            </div>
          </div>
        )}

        {/* Typing dynamic indicator */}
        {loading && !streamingMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 max-w-[85%]"
          >
            <div className="w-7 h-7 border border-primary bg-primary-dim text-primary flex items-center justify-center font-anton text-[10px] shrink-0 mt-0.5">D</div>
            <div className="p-3 bg-surface-low border border-border flex gap-1 items-center rounded-none shadow-sm">
              <span className="font-mono text-[10px] text-primary animate-pulse tracking-wide mr-1.5 uppercase font-bold">Dante is thinking</span>
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} className="w-1.5 h-1.5 rounded-full bg-primary" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15, ease: "easeInOut" }} className="w-1.5 h-1.5 rounded-full bg-primary" />
              <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3, ease: "easeInOut" }} className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Shortcuts Teleporters Panel */}
      <div className="px-4 py-2.5 bg-surface-low border-t border-border flex flex-col gap-2 shrink-0 select-none">
        <div className="font-mono text-[9px] text-text3 uppercase tracking-[1.5px] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
          Terminal Shortcuts (Quick Hotlink):
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {state.categories.map(c => {
            const catColor = getCatColor(c.id, state.theme);
            return (
              <motion.button 
                key={c.id} 
                whileHover={shouldReduce ? undefined : { 
                  scale: 1.05, 
                  backgroundColor: catColor, 
                  color: "#ffffff",
                  borderColor: catColor,
                  boxShadow: `0 0 10px ${catColor}40`
                }}
                whileTap={shouldReduce ? undefined : { scale: 0.95 }}
                className="px-2.5 py-1.5 bg-surface-mid border text-[11px] font-mono font-bold tracking-wider cursor-pointer uppercase flex items-center gap-1.5 rounded-[3px] transition-all"
                style={{
                  borderColor: catColor,
                  color: catColor
                }}
                onClick={() => {
                  updateState({ filterCat: c.id, view: "dashboard" });
                }}
              >
                <span className="material-symbols-outlined text-[13px]">folder_open</span>
                {c.label}
              </motion.button>
            );
          })}
          
          <motion.button 
            whileHover={shouldReduce ? undefined : { 
              scale: 1.05, 
              backgroundColor: "var(--primary)", 
              color: "#1a0a00",
              borderColor: "var(--primary)",
              boxShadow: "0 0 10px var(--primary)"
            }}
            whileTap={shouldReduce ? undefined : { scale: 0.95 }}
            className="px-2.5 py-1.5 bg-surface-mid border border-primary text-primary text-[11px] font-mono font-bold tracking-wider cursor-pointer uppercase flex items-center gap-1.5 rounded-[3px] transition-all"
            onClick={() => {
              updateState({ filterCat: null, view: "dashboard" });
            }}
          >
            <span className="material-symbols-outlined text-[13px]">view_agenda</span>
            All Tasks
          </motion.button>
        </div>
      </div>

      {/* Suggestion Chips */}
      {state.danteHistory.length === 0 && !streamingMessage && !loading && (
        <div className="flex gap-1.5 px-4 pb-2.5 flex-wrap shrink-0 select-none">
          {suggestions.map(s => (
            <motion.button 
              key={s} 
              whileHover={shouldReduce ? undefined : { scale: 1.05, borderColor: "var(--primary)", color: "var(--primary)", boxShadow: "0 0 6px var(--primary-dim)" }}
              whileTap={shouldReduce ? undefined : { scale: 0.95 }}
              className="px-2.5 py-1 bg-surface-mid border border-border text-text3 text-[10px] font-mono cursor-pointer transition-all rounded-[3px]" 
              onClick={() => setInput(s)}
            >
              {s}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className="p-3.5 border-t border-border flex gap-2 bg-surface-low shrink-0 items-center">
        {/* Voice Microphone Input Trigger */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-[42px] h-[40px] flex items-center justify-center border rounded-[3px] transition-all cursor-pointer ${isRecording ? "bg-red text-white border-red animate-pulse" : "bg-surface-high border-border text-text3 hover:text-primary"}`}
          onClick={toggleRecording}
          title={isRecording ? "Recording active. Tap to lock transcript." : "Record with Speech-to-Text"}
        >
          {isRecording ? (
            <div className="flex items-center gap-[1px]">
              <span className="w-[3px] h-3 bg-white rounded-full animate-bounce" />
              <span className="w-[3px] h-4 bg-white rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-[3px] h-2 bg-white rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <span className="material-symbols-outlined text-[18px]">mic</span>
          )}
        </motion.button>

        <textarea
          className="form-textarea flex-1 min-h-[42px] max-h-[100px] resize-none pt-2.5 scrollbar-none rounded-[3px]"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={isRecording ? "Listening active... Speak now." : "Query Dante AI Chief of Staff..."}
        />
        
        <motion.button
          whileHover={shouldReduce ? undefined : { 
            boxShadow: "0 0 12px var(--primary)",
            filter: "brightness(1.15)"
          }}
          whileTap={shouldReduce ? undefined : { scale: 0.94 }}
          className="bg-primary text-[#2c1600] h-[40px] px-4 font-mono text-[11px] font-bold tracking-wide uppercase flex items-center gap-1 border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-[3px]"
          onClick={handleSend}
          disabled={loading || (!input.trim() && !streamingMessage)}
        >
          <span className="material-symbols-outlined text-[16px]">send</span>Send
        </motion.button>
      </div>
    </div>
  );
}
