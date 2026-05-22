"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useZenos } from "../context/ZenosContext";
import { createGoogleCalendarEvent } from "../lib/googleCalendar";

export default function Modals() {
  const { 
    state, 
    showModal, 
    setShowModal, 
    editTaskId, 
    setEditTaskId, 
    addTask, 
    editTask,
    addCategory,
    updateState, 
    fetchGoogleEvents,
    accessToken
  } = useZenos();
  
  const shouldReduce = useReducedMotion();
  
  // Existing tasks & category states
  const [taskData, setTaskData] = useState({ title: '', cat: 'radio', status: 'todo' as const, date: '', reminder: '', note: '', progress: 0 });
  const [newCat, setNewCat] = useState({ label: '', color: '#ffc081' });

  // Custom Meeting scheduler form states
  const [meetingFormData, setMeetingFormData] = useState({
    title: '',
    date: '',
    startTime: '10:00',
    endTime: '11:00',
    guests: '',
    description: '',
    addMeet: true
  });
  const [scheduling, setScheduling] = useState(false);
  const [successEvent, setSuccessEvent] = useState<any | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Sync state initialization upon modal context change
  useEffect(() => {
    if (showModal === 'editTask' && editTaskId) {
      const t = state.tasks.find(x => x.id === editTaskId);
      if (t) {
        setTaskData({
          title: t.title,
          cat: t.cat,
          status: t.status,
          date: t.date,
          reminder: t.reminder,
          note: t.note,
          progress: t.progress
        });
      }
    } else if (showModal === 'addTask') {
      setTaskData({ 
        title: '', 
        cat: state.categories[0]?.id || 'other', 
        status: 'todo', 
        date: state.selectedDate || '', 
        reminder: state.selectedDate ? `${state.selectedDate}T12:00` : '', 
        note: '', 
        progress: 0 
      });
    } else if (showModal === 'scheduleMeeting') {
      setMeetingFormData({
        title: '',
        date: state.selectedDate || new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        guests: '',
        description: '',
        addMeet: true
      });
      setScheduling(false);
      setSuccessEvent(null);
      setCopySuccess(false);
    }
  }, [showModal, editTaskId, state.tasks, state.categories, state.selectedDate]);

  const handleSaveTask = async () => {
    if (!taskData.title.trim()) return;
    if (showModal === 'addTask') {
      await addTask({ ...taskData, steps: [] });
    } else if (showModal === 'editTask' && editTaskId) {
      await editTask(editTaskId, taskData);
    }
    setShowModal(null);
    setEditTaskId(null);
    updateState({ selectedDate: null });
  };

  const handleAddCategory = async () => {
    if (!newCat.label.trim()) return;
    await addCategory(newCat.label, newCat.color);
    setNewCat({ label: '', color: '#ffc081' });
    setShowModal(null);
  };

  // Submit trigger to push new meeting event to Google Calendar API
  const handleScheduleGoogleMeeting = async () => {
    if (!meetingFormData.title.trim() || !meetingFormData.date || !meetingFormData.startTime || !meetingFormData.endTime) {
      alert('Please fill out all required meeting headers.');
      return;
    }

    setScheduling(true);
    try {
      const token = accessToken;
      if (!token) {
        throw new Error('Google oauth access token is missing or expired. Sign in again.');
      }

      const created = await createGoogleCalendarEvent(token, {
        summary: meetingFormData.title,
        description: meetingFormData.description,
        date: meetingFormData.date,
        startTime: meetingFormData.startTime,
        endTime: meetingFormData.endTime,
        guestEmails: meetingFormData.guests ? meetingFormData.guests.split(',').map(e => e.trim()).filter(Boolean) : [],
        addMeetLink: meetingFormData.addMeet
      });

      // Instantly call fetchGoogleEvents to trigger sidebar / dashboard updates
      await fetchGoogleEvents();

      // Formulate a local equivalent and save to localStorage telemetry
      const meetLink = created.hangoutLink || created.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || '';
      const localM = {
        id: created.id || ('meet-' + Date.now()),
        personName: meetingFormData.guests.split(',')[0]?.trim() || 'Internal Operator',
        date: meetingFormData.date,
        time: meetingFormData.startTime,
        subject: meetingFormData.title,
        status: 'upcoming' as const,
        elapsedSeconds: 0,
        notes: (meetingFormData.description ? meetingFormData.description + '\n' : '') + (meetLink ? `Meet url: ${meetLink}` : ''),
        createdAt: new Date().toISOString()
      };

      updateState({
        meetings: [localM, ...(state.meetings || [])]
      });

      setSuccessEvent(created);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Direct workflow Google API insertion failed.');
    } finally {
      setScheduling(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.25, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, scale: shouldReduce ? 1 : 0.92, y: shouldReduce ? 0 : 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    },
    exit: { 
      opacity: 0, 
      scale: shouldReduce ? 1 : 0.92, 
      y: shouldReduce ? 0 : 15,
      transition: { duration: 0.2, ease: "easeInOut" }
    }
  };

  return (
    <AnimatePresence>
      {showModal && (
        <motion.div 
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" 
          onClick={() => { setShowModal(null); setEditTaskId(null); }}
        >
          <motion.div 
            variants={panelVariants}
            className="bg-[#131316] border-[2px] border-border p-6 w-[440px] max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_#111]" 
            onClick={e => e.stopPropagation()}
          >
            {/* ADD / EDIT TASK */}
            {(showModal === 'addTask' || showModal === 'editTask') && (
              <>
                <div className="font-anton text-[18px] tracking-widest text-primary mb-4">
                  {showModal === 'addTask' ? 'NEW TASK' : 'EDIT TASK'}
                </div>
                <div className="mb-3">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Title *</label>
                  <input className="form-input" value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} autoFocus onKeyDown={e => e.key === 'Enter' && handleSaveTask()} />
                </div>
                <div className="mb-3">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Category</label>
                  <select className="form-select" value={taskData.cat} onChange={e => setTaskData({...taskData, cat: e.target.value})}>
                    {state.categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Status</label>
                  <select className="form-select" value={taskData.status} onChange={e => setTaskData({...taskData, status: e.target.value as any})}>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Date</label>
                    <input type="date" className="form-input text-text" value={taskData.date} onChange={e => setTaskData({...taskData, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Reminder</label>
                    <input type="datetime-local" className="form-input text-text" value={taskData.reminder} onChange={e => setTaskData({...taskData, reminder: e.target.value})} />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Progress ({taskData.progress}%)</label>
                  <input type="range" min={0} max={100} className="w-full accent-[var(--primary)]" value={taskData.progress} onChange={e => setTaskData({...taskData, progress: Number(e.target.value)})} />
                </div>
                <div className="mb-4">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Note</label>
                  <textarea className="form-textarea min-h-[60px]" value={taskData.note} onChange={e => setTaskData({...taskData, note: e.target.value})} />
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn border border-border text-text2 hover:bg-surface-high hover:text-text cursor-pointer" onClick={() => { setShowModal(null); setEditTaskId(null); }}>Cancel</button>
                  <button className="btn bg-primary text-[#2c1600] hover:brightness-110 cursor-pointer" onClick={handleSaveTask}>Save</button>
                </div>
              </>
            )}

            {/* ADD CATEGORY */}
            {showModal === 'addCategory' && (
              <>
                <div className="font-anton text-[18px] tracking-widest text-primary mb-4">NEW CATEGORY</div>
                <div className="mb-3">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Name *</label>
                  <input className="form-input" value={newCat.label} onChange={e => setNewCat({...newCat, label: e.target.value})} autoFocus onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                </div>
                <div className="mb-4">
                  <label className="block font-mono text-[9px] text-text3 uppercase tracking-wide mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" className="w-10 h-8 cursor-pointer border border-border bg-surface-mid p-1" value={newCat.color} onChange={e => setNewCat({...newCat, color: e.target.value})} />
                    <span className="font-mono text-[11px] text-text3">{newCat.color}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button className="btn border border-border text-text2 hover:bg-surface-high cursor-pointer" onClick={() => setShowModal(null)}>Cancel</button>
                  <button className="btn bg-primary text-[#2c1600] hover:brightness-110 cursor-pointer" onClick={handleAddCategory}>Add</button>
                </div>
              </>
            )}

            {/* SCHEDULE GOOGLE MEET MODAL */}
            {showModal === 'scheduleMeeting' && (
              <>
                {!successEvent ? (
                  <>
                    <div className="font-anton text-[17px] tracking-widest text-primary mb-1 uppercase">SCHEDULE GOOGLE MEET</div>
                    <div className="font-mono text-[9px] text-text3 tracking-wider border-b border-border pb-3.5 mb-4">DISPATCH ENHANCED VIDEOCONFERENCE SPACE</div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block font-mono text-[8.5px] text-text3 uppercase tracking-wider mb-1">Session Summary / Title *</label>
                        <input 
                          className="form-input" 
                          placeholder="e.g. Weekly Dev Sprint Reviews" 
                          value={meetingFormData.title} 
                          onChange={e => setMeetingFormData({...meetingFormData, title: e.target.value})}
                          autoFocus
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-mono text-[8.5px] text-text3 uppercase tracking-wider mb-1">Date *</label>
                          <input 
                            type="date" 
                            className="form-input text-text text-xs" 
                            value={meetingFormData.date} 
                            onChange={e => setMeetingFormData({...meetingFormData, date: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div>
                            <label className="block font-mono text-[8.5px] text-text3 uppercase tracking-wider mb-1">Start *</label>
                            <input 
                              type="time" 
                              className="form-input text-text text-xs px-1.5" 
                              value={meetingFormData.startTime} 
                              onChange={e => setMeetingFormData({...meetingFormData, startTime: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block font-mono text-[8.5px] text-text3 uppercase tracking-wider mb-1">End *</label>
                            <input 
                              type="time" 
                              className="form-input text-text text-xs px-1.5" 
                              value={meetingFormData.endTime} 
                              onChange={e => setMeetingFormData({...meetingFormData, endTime: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[8.5px] text-text3 uppercase tracking-wider mb-1">Attendee Emails (comma-separated)</label>
                        <input 
                          className="form-input font-mono text-[10px]" 
                          placeholder="e.g. expert@agency.com, support@system.io" 
                          value={meetingFormData.guests} 
                          onChange={e => setMeetingFormData({...meetingFormData, guests: e.target.value})}
                        />
                      </div>

                      <div>
                        <label className="block font-mono text-[8.5px] text-text3 uppercase tracking-wider mb-1">Agenda / Description</label>
                        <textarea 
                          className="form-textarea min-h-[55px] text-[11px]" 
                          placeholder="Write sprint specifications or session highlights..."
                          value={meetingFormData.description} 
                          onChange={e => setMeetingFormData({...meetingFormData, description: e.target.value})}
                        />
                      </div>

                      <div className="flex items-center justify-between bg-surface-mid/80 border border-border px-3 py-2.5 rounded-none">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[17px] text-secondary">video_camera_front</span>
                          <div className="flex flex-col text-left">
                            <span className="font-mono text-[9px] text-text font-bold leading-none select-none">GOOGLE MEET ROOM</span>
                            <span className="font-mono text-[7.5px] text-text3 tracking-wider mt-0.5 select-none font-semibold">AUTO GENERATE URL</span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={meetingFormData.addMeet}
                            onChange={e => setMeetingFormData({...meetingFormData, addMeet: e.target.checked})}
                          />
                          <div className="w-9 h-5 bg-border rounded-none peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0d0d0f] after:border-none after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 mt-5">
                      <button 
                        disabled={scheduling}
                        className="btn border border-border text-text2 hover:bg-surface-high cursor-pointer select-none font-mono text-[11px]" 
                        onClick={() => setShowModal(null)}
                      >
                        CANCEL
                      </button>
                      <button 
                        disabled={scheduling}
                        className="btn bg-primary text-[#2c1600] font-mono font-bold tracking-wide uppercase hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer select-none text-[11px]" 
                        onClick={handleScheduleGoogleMeeting}
                      >
                        {scheduling ? 'SCHEDULING...' : 'DISPATCH EVENT'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center py-2 flex flex-col items-center">
                      <div className="w-11 h-11 bg-primary/15 border border-primary flex items-center justify-center rounded-none mb-3 text-primary animate-bounce">
                        <span className="material-symbols-outlined text-[26px]">task_alt</span>
                      </div>
                      
                      <div className="font-anton text-[17px] tracking-widest text-primary uppercase select-none">
                        CALENDAR PORTAL DISPATCHED
                      </div>
                      <div className="font-mono text-[8px] text-text3 tracking-widest uppercase mt-0.5 mb-5 select-none font-semibold">
                        TRANSMISSION STABLE // EVENT ONLINE
                      </div>

                      <div className="w-full bg-[#17171d] border border-border p-3.5 mb-5 text-left text-xs space-y-1.5 font-mono">
                        <div>
                          <span className="text-text3 uppercase text-[8px]">Summary:</span><br />
                          <span className="text-text font-bold text-[11.5px] leading-tight block mt-0.5">{successEvent.summary}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/45">
                          <div>
                            <span className="text-text3 uppercase text-[8px]">Date:</span><br />
                            <span className="text-text font-semibold">{successEvent.start?.dateTime ? successEvent.start.dateTime.split('T')[0] : successEvent.start?.date}</span>
                          </div>
                          <div>
                            <span className="text-text3 uppercase text-[8px]">Time:</span><br />
                            <span className="text-text font-semibold">
                              {successEvent.start?.dateTime ? new Date(successEvent.start.dateTime).toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'}) : 'ALL DAY'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Display Google Meet Url details */}
                      {(() => {
                        const meetUrl = successEvent.hangoutLink || successEvent.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
                        if (!meetUrl) return null;

                        return (
                          <div className="w-full space-y-2 text-left">
                            <label className="block font-mono text-[8px] text-text3 uppercase tracking-wider select-none font-bold">Generated Video Space Link</label>
                            <div className="flex gap-2 w-full">
                              <input 
                                readOnly 
                                value={meetUrl} 
                                className="form-input flex-1 font-mono text-[10px] bg-black/40 text-secondary border-dashed"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(meetUrl);
                                  setCopySuccess(true);
                                  setTimeout(() => setCopySuccess(false), 2000);
                                }}
                                className="px-3 bg-surface-mid border border-border text-primary hover:text-text hover:bg-surface-high font-mono text-[10.5px] font-bold uppercase cursor-pointer transition-all shrink-0 rounded-none"
                              >
                                {copySuccess ? 'COPIED!' : 'COPY'}
                              </button>
                            </div>

                            <a 
                              href={meetUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3.5 h-[44px] w-full bg-secondary text-[#0a161c] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all select-none rounded-none cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[18px]">video_chat</span>
                              ⚡ Join Meet Now
                            </a>
                          </div>
                        );
                      })()}

                      <button
                        onClick={() => {
                          setShowModal(null);
                          setSuccessEvent(null);
                        }}
                        className="mt-6 w-full py-2 bg-surface-mid border border-border hover:bg-surface-high text-text3 hover:text-text font-mono text-[10.5px] uppercase select-none transition-all cursor-pointer rounded-none"
                      >
                        CLOSE CABINET
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* INSTANT MEET SUCCESS */}
            {showModal === 'instantMeetSuccess' && state.instantMeetEvent && (
              <>
                <div className="text-center py-2 flex flex-col items-center">
                  <div className="w-11 h-11 bg-secondary/15 border border-secondary flex items-center justify-center rounded-none mb-3 text-secondary animate-pulse">
                    <span className="material-symbols-outlined text-[26px]">bolt</span>
                  </div>
                  
                  <div className="font-anton text-[17px] tracking-widest text-secondary uppercase select-none">
                    INSTANT MEET SPACE CREATED
                  </div>
                  <div className="font-mono text-[8px] text-text3 tracking-widest uppercase mt-0.5 mb-5 select-none font-semibold">
                    1-HOUR RESERVATION ONLINE
                  </div>

                  <div className="w-full bg-[#17171d] border border-border p-3.5 mb-5 text-left text-xs space-y-1 font-mono">
                    <div>
                      <span className="text-text3 uppercase text-[8px]">Summary:</span><br />
                      <span className="text-text font-bold text-[11.5px] leading-tight block mt-0.5">{state.instantMeetEvent.summary}</span>
                    </div>
                  </div>

                  {/* Display Google Meet Url details */}
                  {(() => {
                    const meetUrl = state.instantMeetEvent.hangoutLink || state.instantMeetEvent.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri;
                    if (!meetUrl) return null;

                    return (
                      <div className="w-full space-y-2 text-left">
                        <label className="block font-mono text-[8px] text-text3 uppercase tracking-wider select-none font-bold">Video Space Link</label>
                        <div className="flex gap-2 w-full">
                          <input 
                            readOnly 
                            value={meetUrl} 
                            className="form-input flex-1 font-mono text-[10px] bg-black/40 text-secondary border-dashed"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(meetUrl);
                              setCopySuccess(true);
                              setTimeout(() => setCopySuccess(false), 2000);
                            }}
                            className="px-3 bg-surface-mid border border-border text-primary hover:text-text hover:bg-surface-high font-mono text-[10.5px] font-bold uppercase cursor-pointer transition-all shrink-0 rounded-none"
                          >
                            {copySuccess ? 'COPIED!' : 'COPY'}
                          </button>
                        </div>

                        <a 
                          href={meetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3.5 h-[44px] w-full bg-secondary text-[#0a161c] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all select-none rounded-none cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">bolt</span>
                          ⚡ Enter Instant Meet
                        </a>
                      </div>
                    );
                  })()}

                  <button
                    onClick={() => {
                      setShowModal(null);
                      updateState({ instantMeetEvent: null });
                    }}
                    className="mt-6 w-full py-2 bg-surface-mid border border-border hover:bg-surface-high text-text3 hover:text-text font-mono text-[10.5px] uppercase select-none transition-all cursor-pointer rounded-none"
                  >
                    CLOSE GATEWAY
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
