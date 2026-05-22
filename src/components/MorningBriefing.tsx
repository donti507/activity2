"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useZenos } from "../context/ZenosContext";
import { supabase } from "../lib/supabase";

export default function MorningBriefing() {
  const { 
    state, 
    user, 
    showBriefing, 
    setShowBriefing, 
    updateState,
    googleEvents 
  } = useZenos();

  const [weather, setWeather] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Operator";
  const todayStr = new Date().toISOString().split("T")[0];

  // Load weather using free, non-authenticated Open-Meteo endpoint
  useEffect(() => {
    if (!showBriefing) return;

    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await res.json();
        if (data && data.current_weather) {
          setWeather(data.current_weather);
        }
      } catch (err) {
        console.error("Failed to query meteo forecast data:", err);
      } finally {
        setLoadingWeather(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback location: London
          fetchWeather(51.5074, -0.1278);
        }
      );
    } else {
      fetchWeather(51.5074, -0.1278);
    }
  }, [showBriefing]);

  // Handle SpeechSynthesis audio narration on load
  useEffect(() => {
    if (!showBriefing || typeof window === "undefined" || !window.speechSynthesis) return;

    // Wait slightly to ensure user interacted to bypass browser auto-play restrictions
    const timeout = setTimeout(() => {
      window.speechSynthesis.cancel();
      const sentence = `GOOD MORNING ${name.toUpperCase()}. HERE IS YOUR DAY.`;
      const utterance = new SpeechSynthesisUtterance(sentence);
      
      const voices = window.speechSynthesis.getVoices();
      const backupVoice = voices.find(v => v.lang.startsWith("en-US")) || voices[0];
      if (backupVoice) {
        utterance.voice = backupVoice;
      }
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      window.speechSynthesis.speak(utterance);
    }, 600);

    return () => {
      clearTimeout(timeout);
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [showBriefing, name]);

  if (!showBriefing) return null;

  // Track task loads
  const tasksList = state.tasks || [];
  const todayTasks = tasksList.filter((t: any) => t.date === todayStr);
  const upcomingMeetings = state.meetings?.filter((m: any) => m.status === "upcoming") || [];

  // Generate beautiful weather translations
  const getWeatherDescription = (code: number) => {
    if (code === 0) return "Sky Clear · Optimum Operations";
    if (code >= 1 && code <= 3) return "Partly Cloudy · Normal Visibility";
    if (code >= 45 && code <= 48) return "Fog density observed";
    if (code >= 51 && code <= 67) return "Drizzle & Rain showers active";
    if (code >= 71 && code <= 77) return "Snow fall detected";
    if (code >= 80 && code <= 82) return "Heavy rain warning";
    return "Stable atmospheric vectors";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Start My Day: Save briefing viewed state and dismiss overlay
  const handleStartMyDay = async () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    setShowBriefing(false);
    updateState({ view: "dashboard" });

    // Store today as seen
    try {
      localStorage.setItem(`zenos_briefing_seen_${todayStr}`, "true");
    } catch (e) {}

    if (user && user.id !== "offline-user-123") {
      try {
        await supabase
          .from("dante_briefing_meta")
          .upsert({ user_id: user.id, last_seen_date: todayStr });
      } catch (err) {
        console.error("Could not upload briefing metadata:", err);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 min-h-screen w-screen bg-[#0d0d0f] text-[#f4eedb] z-[9999] flex flex-col p-6 md:p-12 overflow-y-auto select-none font-mono selection:bg-[#ffc081] selection:text-[#131316]"
      >
        {/* Extreme brutalist abstract background outline */}
        <div className="absolute inset-0 border-[16px] border-[#ffc081]/30 pointer-events-none z-0" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#ffc081]/5 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-5xl w-full mx-auto flex-1 flex flex-col justify-between py-4">
          
          {/* Top heading strip - brutalist ticker style */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#ffc081] pb-6">
            <div>
              <div className="font-anton text-[40px] md:text-[56px] tracking-wider text-[#ffc081] leading-none uppercase">
                ZEN OS BRIEFING
              </div>
              <div className="text-[12px] md:text-[14px] text-[#f4eedb]/80 font-bold uppercase tracking-[2px] mt-1.5">
                Dante AI System Analysis · {formattedDate}
              </div>
            </div>
            {/* Meteorological Panel */}
            <div className="p-3 border border-[#ffc081]/40 bg-[#141417]/80 flex flex-col items-start md:items-end min-w-[200px]">
              <div className="text-[8px] tracking-[2px] text-[#ffc081] uppercase font-bold mb-1">METEOROLOGICAL telemetry</div>
              {loadingWeather ? (
                <div className="text-[11px] animate-pulse text-[#d6c9b3]">ACQUIRING WEATHER...</div>
              ) : weather ? (
                <>
                  <div className="text-[16px] font-bold text-white leading-none">
                    {weather.temperature}°C
                  </div>
                  <div className="text-[11px] text-[#d6c9b3] uppercase tracking-wider mt-1">
                    {getWeatherDescription(weather.weathercode)}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-red uppercase">Weather data offline</div>
              )}
            </div>
          </div>

          {/* Core grid elements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8 flex-1 items-stretch">
            
            {/* Quadrant 1: Today's Priorities */}
            <div className="p-5 border-2 border-[#ffc081] bg-[#141417]/90 flex flex-col">
              <div className="font-anton text-[18px] tracking-wider text-[#ffc081] border-b border-[#ffc081]/30 pb-2 mb-3 uppercase">
                🎯 Today's Task Vectors ({todayTasks.length})
              </div>
              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2.5 scrollbar-none">
                {todayTasks.length === 0 ? (
                  <div className="text-[11px] italic text-[#f4eedb]/60 uppercase pt-4">No schedule deadlines recorded for today. Core tasks clear.</div>
                ) : (
                  todayTasks.map((t: any) => (
                    <div key={t.id} className="p-2 border border-[#f4eedb]/15 bg-black/40 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[13px] text-[#ffc081] mt-0.5">radio_button_checked</span>
                      <div>
                        <div className="text-[11px] font-bold text-[#faf3e0] uppercase">{t.title}</div>
                        <div className="text-[8px] font-mono tracking-wider text-[#ffc081] uppercase mt-0.5">Workspace: {t.cat || "General"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quadrant 2: Scheduled priority logs */}
            <div className="p-5 border-2 border-[#ffc081] bg-[#141417]/90 flex flex-col">
              <div className="font-anton text-[18px] tracking-wider text-[#ffc081] border-b border-[#ffc081]/30 pb-2 mb-3 uppercase">
                🤝 Priority Synapse Sessions ({upcomingMeetings.length})
              </div>
              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2.5 scrollbar-none">
                {upcomingMeetings.length === 0 ? (
                  <div className="text-[11px] italic text-[#f4eedb]/60 uppercase pt-4">No external prioritized sessions lined up. Focus mode optimal.</div>
                ) : (
                  upcomingMeetings.map((m: any) => (
                    <div key={m.id} className="p-2 border border-[#f4eedb]/15 bg-black/40 flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] text-primary mt-0.5">handshake</span>
                      <div>
                        <div className="text-[11px] font-bold text-[#faf3e0] uppercase">{m.personName}</div>
                        <div className="text-[9px] text-text3 italic mt-0.5">"{m.subject}"</div>
                        <div className="font-mono text-[8px] text-[#ffc081] uppercase mt-0.5">{m.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quadrant 3: Intelligence Insights / Streak Analysis */}
            <div className="p-5 border-2 border-[#ffc081] bg-[#141417]/90 flex flex-col">
              <div className="font-anton text-[18px] tracking-wider text-[#ffc081] border-b border-[#ffc081]/30 pb-2 mb-3 uppercase">
                ⚡ Performance Analytics
              </div>
              <div className="space-y-4">
                <div className="p-3 border border-[#ffc081]/25 bg-black/40">
                  <div className="text-[8px] tracking-[1px] text-primary uppercase font-bold mb-1">Operating Streak System</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[28px] font-bold text-white font-anton leading-none">5</span>
                    <span className="text-[10px] tracking-wider text-[#ffc081] uppercase font-bold font-mono">DAYS STRAIGHT SUCCESS</span>
                  </div>
                </div>

                <div className="p-3 border border-[#ffc081]/25 bg-black/40">
                  <div className="text-[8px] tracking-[1px] text-primary uppercase font-bold mb-1">MIND VECTOR QUOTE</div>
                  <div className="text-[11px] text-[#faf3e0] uppercase font-mono italic leading-relaxed">
                    “The discipline you create today configures the autonomy you wield tomorrow.”
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar Controls - start my day button */}
          <div className="border-t-2 border-[#ffc081]/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-[9px] tracking-[1.5px] text-[#f4eedb]/60 text-center sm:text-left">
              ZEN_OS / Dante intelligence engine computes optimal productivity vectors for {name.toUpperCase()}...
            </div>
            
            <button
              onClick={handleStartMyDay}
              className="px-8 py-3 bg-[#ffc081] text-[#131316] font-anton text-[18px] tracking-widest hover:bg-white active:scale-95 border-none cursor-pointer transition-all select-none uppercase shadow-lg shadow-[#ffc081]/20 rounded-none w-full sm:w-auto text-center"
            >
              START MY DAY
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
