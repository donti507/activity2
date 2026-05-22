"use client";

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useZenos } from '../../context/ZenosContext';
import { Meeting } from '../../types';

export default function Meetings() {
  const { state, updateState, setShowModal } = useZenos();
  const shouldReduce = useReducedMotion();
  
  const meetings = state.meetings || [];

  // Form states
  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [subject, setSubject] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Active meeting stopwatch states
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isTicking, setIsTicking] = useState(false);
  const [liveNotes, setLiveNotes] = useState('');

  // Standalone casual stopwatch states (desk assistant tracking)
  const [saElapsed, setSaElapsed] = useState(0);
  const [saTicking, setSaTicking] = useState(false);
  const saTimerRef = useRef<NodeJS.Timeout | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Live Timer for active meeting session
  useEffect(() => {
    if (isTicking && activeMeetingId) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1;
          // Sync to state so it preserves even in localStorage
          const updated = meetings.map(m => 
            m.id === activeMeetingId ? { ...m, elapsedSeconds: next, notes: liveNotes } : m
          );
          updateState({ meetings: updated });
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTicking, activeMeetingId, liveNotes]);

  // Handle live notes typing sync to persist
  const handleNotesChange = (txt: string) => {
    setLiveNotes(txt);
    if (activeMeetingId) {
      const updated = meetings.map(m => 
        m.id === activeMeetingId ? { ...m, notes: txt } : m
      );
      updateState({ meetings: updated });
    }
  };

  // Standalone Stopwatch timer
  useEffect(() => {
    if (saTicking) {
      saTimerRef.current = setInterval(() => {
        setSaElapsed(p => p + 1);
      }, 1000);
    } else {
      if (saTimerRef.current) clearInterval(saTimerRef.current);
    }
    return () => {
      if (saTimerRef.current) clearInterval(saTimerRef.current);
    };
  }, [saTicking]);

  const handleAddMeeting = (e: FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !date || !time || !subject.trim()) {
      setErrorMsg('All fields are requested to form a meeting arrangement.');
      return;
    }
    setErrorMsg('');

    const newM: Meeting = {
      id: 'meet-' + Date.now(),
      personName: personName.trim(),
      date,
      time,
      subject: subject.trim(),
      status: 'upcoming',
      elapsedSeconds: 0,
      notes: '',
      createdAt: new Date().toISOString()
    };

    updateState({ meetings: [newM, ...meetings] });
    
    // Reset Form
    setPersonName('');
    setDate('');
    setTime('');
    setSubject('');
    setShowAddForm(false);
  };

  const startSession = (meeting: Meeting) => {
    // If there is already an ongoing meeting, pause it
    setIsTicking(false);
    
    // Set active meeting
    setActiveMeetingId(meeting.id);
    setElapsed(meeting.elapsedSeconds || 0);
    setLiveNotes(meeting.notes || '');
    setIsTicking(true);

    // Update status to ongoing
    const updated = meetings.map(m => 
      m.id === meeting.id ? { ...m, status: 'ongoing' as const } : m
    );
    updateState({ meetings: updated });
  };

  const pauseSession = () => {
    setIsTicking(false);
  };

  const resumeSession = () => {
    setIsTicking(true);
  };

  const concludeSession = () => {
    setIsTicking(false);
    if (!activeMeetingId) return;

    const updated = meetings.map(m => 
      m.id === activeMeetingId ? { ...m, status: 'completed' as const, elapsedSeconds: elapsed, notes: liveNotes } : m
    );
    updateState({ meetings: updated });
    setActiveMeetingId(null);
    setElapsed(0);
    setLiveNotes('');
  };

  const deleteMeeting = (id: string) => {
    if (activeMeetingId === id) {
      setIsTicking(false);
      setActiveMeetingId(null);
    }
    updateState({ meetings: meetings.filter(m => m.id !== id) });
  };

  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return [
      String(hrs).padStart(2, '0'),
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0')
    ].join(':');
  };

  const activeMeeting = meetings.find(m => m.id === activeMeetingId);

  // Filter meetings by status
  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');
  const finishedMeetings = meetings.filter(m => m.status === 'completed');
  const ongoingMeetings = meetings.filter(m => m.status === 'ongoing');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full overflow-y-auto pb-8">
      {/* LEFT COLUMN: Meeting logs and form scheduling */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        
        {/* Header Ribbon */}
        <div className="bg-surface-low border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-anton text-[16px] tracking-widest text-primary uppercase">MEETING STUDIO</div>
            <div className="text-[10px] font-mono text-text3 uppercase tracking-wider mt-0.5">Schedule sessions, trace minutes, and track active call stopwatch meters.</div>
          </div>
          
          <motion.button
            whileHover={shouldReduce ? undefined : { scale: 1.03 }}
            whileTap={shouldReduce ? undefined : { scale: 0.97 }}
            onClick={() => setShowModal('scheduleMeeting')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-surface-mid border border-primary text-primary text-[11px] font-mono font-bold tracking-wider cursor-pointer uppercase hover:bg-primary-dim transition-all text-center self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[14px]">
              add_circle
            </span>
            Schedule Meeting
          </motion.button>
        </div>

        {/* Schedule Form Panel */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onSubmit={handleAddMeeting}
              className="bg-surface-low border border-border p-4 overflow-hidden flex flex-col gap-3"
            >
              <div className="font-mono text-[9px] text-primary uppercase tracking-[1.5px] border-b border-border pb-1 mb-1">
                ARRANGE NEW COLLABORATION SESSION
              </div>
              
              {errorMsg && (
                <div className="text-[11px] text-secondary font-mono bg-secondary-dim border border-secondary/20 p-2 uppercase">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[8.5px] text-text3 uppercase mb-1">COLLABORATOR NAME *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Professor Dante" 
                    className="form-input" 
                    value={personName} 
                    onChange={e => setPersonName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[8.5px] text-text3 uppercase mb-1">DATE *</label>
                    <input 
                      type="date" 
                      className="form-input text-text text-[11px]" 
                      value={date} 
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[8.5px] text-text3 uppercase mb-1">TIME *</label>
                    <input 
                      type="time" 
                      className="form-input text-text text-[11px]" 
                      value={time} 
                      onChange={e => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-mono text-[8.5px] text-text3 uppercase mb-1">SUBJECT / SPRINT AGENDA *</label>
                <textarea 
                  placeholder="e.g. Discuss deployment pipelines, database schema validations, and UI feedback integrations" 
                  className="form-textarea min-h-[50px] text-[11px]" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-1">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="px-3 py-1.5 bg-surface-mid border border-border text-text3 text-[11px] font-mono hover:text-text cursor-pointer hover:bg-surface-high"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-1.5 bg-primary text-[#1a0a00] text-[11px] font-mono font-bold hover:brightness-110 cursor-pointer"
                >
                  CONFIRM SCHEDULE
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* ONGOING MEETING CONTROLLER */}
        {activeMeetingId && activeMeeting && (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-mid border-[1.5px] border-primary p-4 flex flex-col gap-3 shadow-[0_0_15px_rgba(255,192,129,0.15)]"
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-anton text-[13px] tracking-widest text-primary uppercase">ACTIVE STREAMING SESSION</span>
              </div>
              <div className="font-mono text-[10px] text-text3">
                Created: {new Date(activeMeeting.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              
              {/* Stopwatch Counter Card */}
              <div className="md:col-span-5 bg-[#0b0c0a] border border-border p-4 flex flex-col items-center justify-center rounded-sm">
                <div className="text-[10px] font-mono text-secondary tracking-widest uppercase mb-1">SESSION STOPWATCH METER</div>
                <div className="font-mono text-3xl md:text-4xl text-primary font-bold tracking-wider select-all animate-pulse shadow-sm">
                  {formatStopwatch(elapsed)}
                </div>
                
                {/* Control Triggers */}
                <div className="flex gap-2.5 mt-3.5">
                  {isTicking ? (
                    <button 
                      onClick={pauseSession}
                      className="px-3 py-1 bg-surface-mid border border-secondary text-secondary text-[10px] font-mono flex items-center gap-1 hover:bg-secondary/10 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">pause</span> PAUSE
                    </button>
                  ) : (
                    <button 
                      onClick={resumeSession}
                      className="px-3 py-1 bg-surface-mid border border-primary text-primary text-[10px] font-mono flex items-center gap-1 hover:bg-primary/10 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[12px]">play_arrow</span> TICK
                    </button>
                  )}
                  
                  <button 
                    onClick={concludeSession}
                    className="px-3 py-1 bg-surface-high border border-red-500 text-red-400 text-[10px] font-mono flex items-center gap-1 hover:bg-red-500/10 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[12px]">stop</span> CONCLUDE & SAVE
                  </button>
                </div>
              </div>

              {/* Call Details / Live Notes */}
              <div className="md:col-span-7 flex flex-col gap-1.5 h-full justify-between">
                <div>
                  <div className="font-mono text-[12px] font-bold text-text">
                    With: <span className="text-secondary">{activeMeeting.personName}</span>
                  </div>
                  <div className="font-mono text-[10px] text-text2 mt-0.5 italic">
                    "{activeMeeting.subject}"
                  </div>
                </div>

                <div className="mt-2 text-left">
                  <label className="block font-mono text-[8.5px] text-text3 uppercase mb-1">LIVE MINUTES / CALL NOTES</label>
                  <textarea 
                    placeholder="Draft real-time action items, logs, agreed deliverables here to record permanently..." 
                    value={liveNotes}
                    onChange={e => handleNotesChange(e.target.value)}
                    className="form-textarea min-h-[68px] text-[11px] font-mono bg-[#0b0c0a] text-primary"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* MEETINGS LIST ARCHIVE */}
        <div className="border border-border bg-surface-low p-4 flex-1 flex flex-col">
          <div className="font-mono text-[9px] text-text3 uppercase tracking-[1.5px] border-b border-border pb-1.5 mb-3">
            SCHEDULED COLLABORATION INDEX
          </div>

          {meetings.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text3 font-mono">
              <span className="material-symbols-outlined text-4xl text-border mb-2">handshake</span>
              <div className="text-[12px] uppercase tracking-wider text-text2">No meetings registered inside ZEN_OS</div>
              <div className="text-[10px] mt-1 max-w-sm">Define a custom partner arrangement, track stopwatch durations, and write quick session notes seamlessly.</div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
              {/* Filter lists */}
              
              {/* ONGOING list (if any not actively focused) */}
              {ongoingMeetings.filter(m => m.id !== activeMeetingId).map(m => (
                <div key={m.id} className="bg-surface-mid border border-secondary p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping" />
                      <span className="font-mono text-[11px] text-secondary uppercase font-bold tracking-wider">ONGOING</span>
                      <span className="font-mono text-[11px] text-text font-bold ml-1">{m.personName}</span>
                    </div>
                    <div className="text-[11px] text-text2 font-mono mt-0.5">{m.subject}</div>
                    <div className="text-[9px] text-text3 font-mono mt-1">
                      {m.date} @ {m.time} | Duration: {formatStopwatch(m.elapsedSeconds || 0)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => startSession(m)}
                      className="px-2.5 py-1 bg-surface-low border border-secondary text-secondary font-mono text-[10px] hover:bg-secondary hover:text-[#1a0a00] cursor-pointer transition-all uppercase"
                    >
                      RESUME FOCUS
                    </button>
                    <button 
                      onClick={() => deleteMeeting(m.id)}
                      className="icon-btn"
                    >
                      <span className="material-symbols-outlined text-[15px] text-red-400">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {/* UPCOMING list */}
              {upcomingMeetings.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="font-mono text-[8px] text-primary tracking-widest uppercase mb-0.5">UPCOMING SCHEDULES ({upcomingMeetings.length})</div>
                  {upcomingMeetings.map(m => (
                    <motion.div 
                      key={m.id}
                      whileHover={{ x: 2, borderColor: 'var(--primary)' }}
                      className="bg-surface-mid border border-border p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors duration-150"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="font-mono text-[11.5px] text-text font-bold">{m.personName}</span>
                          <span className="text-[9.5px] font-mono text-[var(--primary)] border border-primary/25 px-1.5 py-px bg-primary/5">
                            {m.date} @ {m.time}
                          </span>
                        </div>
                        <div className="text-[11px] text-text2 font-mono mt-1.5">{m.subject}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button 
                          onClick={() => startSession(m)}
                          className="px-2.5 py-1 bg-surface-low border border-primary text-primary font-mono text-[10px] hover:bg-primary hover:text-[#1a0a00] cursor-pointer transition-all uppercase flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[13px]">play_arrow</span> START CALL
                        </button>
                        <button 
                          onClick={() => deleteMeeting(m.id)}
                          className="icon-btn hover:bg-red-500/10"
                        >
                          <span className="material-symbols-outlined text-[15px] text-red-400">delete</span>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* COMPLETED list */}
              {finishedMeetings.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="font-mono text-[8px] text-text3 tracking-widest uppercase mb-0.5">FINISHED & INVOICED LOGS ({finishedMeetings.length})</div>
                  {finishedMeetings.map(m => (
                    <div 
                      key={m.id}
                      className="bg-surface-mid/60 border border-border/80 p-3 flex flex-col gap-2 opacity-85 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="material-symbols-outlined text-green-400 text-[14px]">check_circle</span>
                            <span className="font-mono text-[11.5px] text-text3 line-through">{m.personName}</span>
                            <span className="text-[9px] font-mono text-text3 border border-border px-1">
                              {m.date}
                            </span>
                          </div>
                          <div className="text-[11px] text-text2 font-mono mt-0.5">{m.subject}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-secondary uppercase bg-secondary-dim/30 border border-secondary/20 px-2 py-0.5">
                            ⏱ {formatStopwatch(m.elapsedSeconds || 0)}
                          </span>
                          <button 
                            onClick={() => deleteMeeting(m.id)}
                            className="icon-btn hover:bg-red-500/10"
                          >
                            <span className="material-symbols-outlined text-[15px] text-red-400">delete</span>
                          </button>
                        </div>
                      </div>

                      {m.notes && (
                        <div className="bg-[#0c0d0a] border border-border/40 p-2 text-[10px] font-mono text-primary/80 mt-1 rounded-sm relative">
                          <span className="absolute top-1 right-2 text-[8px] text-text3 uppercase">MINUTES</span>
                          <div className="whitespace-pre-wrap">{m.notes}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Standalone Workspace Stopwatch & Helper Instructions */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* STANDALONE STOPWATCH */}
        <div className="bg-surface-low border border-border p-4 flex flex-col items-center justify-center">
          <div className="font-mono text-[9px] text-text3 uppercase tracking-[1.5px] border-b border-border w-full pb-1.5 mb-3 text-center">
            DESK ASSISTANT STOPWATCH
          </div>
          
          <div className="bg-surface-highest border border-border/80 rounded-lg p-5 w-full flex flex-col items-center justify-center">
            <div className="text-[9px] font-mono font-bold text-text2 tracking-widest uppercase mb-1 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full bg-primary ${saTicking ? 'animate-ping' : ''}`} />
              GENERAL TIME MONITOR
            </div>
            
            <div className="font-mono text-4xl text-[var(--primary)] font-bold tracking-wider select-all select-none my-1.5">
              {formatStopwatch(saElapsed)}
            </div>

            <div className="flex items-center gap-2.5 mt-3 w-full">
              {saTicking ? (
                <button
                  type="button"
                  onClick={() => setSaTicking(false)}
                  className="flex-1 py-1.5 bg-surface-mid border border-secondary text-secondary text-[10px] font-mono font-bold hover:bg-secondary/10 cursor-pointer text-center uppercase"
                >
                  PAUSE
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSaTicking(true)}
                  className="flex-1 py-1.5 bg-surface-mid border border-primary text-primary text-[10px] font-mono font-bold hover:bg-primary/20 cursor-pointer text-center uppercase"
                >
                  START
                </button>
              )}

              <button
                type="button"
                onClick={() => { setSaTicking(false); setSaElapsed(0); }}
                className="px-3 py-1.5 bg-surface-mid border border-border text-text3 text-[10px] font-mono hover:bg-surface-high cursor-pointer text-center uppercase"
              >
                RESET
              </button>
            </div>
          </div>
          
          <p className="text-[10px] text-text3 font-mono mt-3.5 leading-relaxed text-center">
            Log general workout blocks, coding sessions, or test iterations completely independent of meetings.
          </p>
        </div>

        {/* WORKSPACE PRODUCTIVITY TIP */}
        <div className="bg-surface-low border border-border p-4">
          <div className="font-mono text-[9.5px] text-primary tracking-widest uppercase border-b border-border pb-1.5 mb-2.5 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">tips_and_updates</span>
            ZEN COLLABORATION TIP
          </div>
          <div className="flex flex-col gap-2.5 text-[10.5px] font-mono text-text2 leading-relaxed">
            <p>
              1. **Sprint Tracking**: Standard dev sprints benefit from logging live minutes. Tick the stopwatch as you align tasks to prevent scope creep.
            </p>
            <p>
              2. **Invoiceable Time**: Invoicing clients? The stopwatch automatically formats hours, minutes, and seconds so you can save precise time logs.
            </p>
            <p>
              3. **Archived Logs**: Saving completed sessions automatically embeds your transcript logs in the index below for retrospective review.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
