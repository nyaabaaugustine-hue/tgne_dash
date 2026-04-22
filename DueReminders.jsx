import React, { useState, useCallback, useEffect } from 'react';
import { differenceInCalendarDays, parseISO, format } from 'date-fns';

/**
 * DueReminders — Renewal schedule marquee + Send Client Alert modal
 *
 * Props:
 *   reminders   — array of { id, clientId, clientName, clientEmail, serviceType, dueDate, daysLeft?, ... }
 *   onEditClient — called with reminder item when pencil icon clicked
 */
const DueReminders = ({ reminders = [], onEditClient }) => {
  const scrollItems = [...reminders, ...reminders];

  // ── Modal state ────────────────────────────────────────────────────────────
  const [modal, setModal]         = useState(null);   // null | reminder item
  const [types, setTypes]         = useState({ website: true, reminder: true, invoice: true, task: true });
  const [daysWindow, setDaysWindow] = useState(30);
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState(null);   // null | { ok, message, alertCount }

  const openModal = useCallback((item, e) => {
    e.stopPropagation();
    setModal(item);
    setTypes({ website: true, reminder: true, invoice: true, task: true });
    setDaysWindow(30);
    setResult(null);
    setSending(false);
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setResult(null);
  }, []);

  // Close on backdrop click
  const onBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget) closeModal();
  }, [closeModal]);

  // Close on Escape
  useEffect(() => {
    if (!modal) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal, closeModal]);

  const toggleType = (t) => setTypes(prev => ({ ...prev, [t]: !prev[t] }));

  const selectedTypes = Object.entries(types).filter(([, v]) => v).map(([k]) => k);

  const handleSend = async () => {
    if (!modal?.clientId) return;
    if (selectedTypes.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/send-client-alert', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          clientId:   modal.clientId,
          types:      selectedTypes,
          daysWindow,
        }),
      });
      const data = await res.json();
      if (data.sent) {
        setResult({ ok: true, message: `Email sent to ${data.to}`, alertCount: data.alertCount });
      } else {
        setResult({ ok: false, message: data.error || 'Email not sent' });
      }
    } catch (err) {
      setResult({ ok: false, message: err.message || 'Network error' });
    } finally {
      setSending(false);
    }
  };

  // ── Type config ────────────────────────────────────────────────────────────
  const TYPE_META = {
    website:  { label: 'Domain/Hosting Renewals', icon: '🌐', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
    reminder: { label: 'Reminders',               icon: '🔔', color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe' },
    invoice:  { label: 'Pending Invoices',         icon: '🧾', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
    task:     { label: 'Due Tasks',                icon: '✅', color: '#10b981', bg: '#f0fdf4', border: '#a7f3d0' },
  };

  const WINDOW_OPTIONS = [
    { value: 7,  label: '7 days' },
    { value: 14, label: '14 days' },
    { value: 30, label: '30 days' },
    { value: 60, label: '60 days' },
    { value: 90, label: '90 days' },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ────────────────────────────────────────────────────── Marquee strip */}
      <div className="w-full py-8 bg-[#ECF1F3] font-['Inter',_sans-serif] overflow-hidden">
        <div className="px-6 mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#4A7289] tracking-tight flex items-center gap-2">
            <span className="w-2 h-6 bg-[#8585E3] rounded-full inline-block" />
            Renewal Schedule
          </h2>
          <span className="text-xs font-bold text-white bg-[#8585E3] px-3 py-1 rounded-full shadow-sm shadow-[#8585E3]/30">
            {reminders.length} ACTIVE
          </span>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="flex w-max animate-marquee hover:pause-marquee py-4">
            {reminders.length > 0 ? (
              scrollItems.map((item, index) => {
                try {
                  const dueDate   = parseISO(item.dueDate);
                  const today     = new Date();
                  const daysLeft  = item.daysLeft ?? differenceInCalendarDays(dueDate, today);
                  const isUrgent  = daysLeft <= 7;
                  const isOverdue = daysLeft < 0;

                  return (
                    <div
                      key={`${item.id}-${index}`}
                      className="mx-3 min-w-[300px] bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(133,133,227,0.15)] hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
                    >
                      {/* Status pill */}
                      <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-bl-xl ${isOverdue ? 'bg-red-600 text-white' : isUrgent ? 'bg-red-500 text-white' : 'bg-[#ECF1F3] text-[#4A7289]'}`}>
                        {isOverdue ? 'Overdue' : isUrgent ? 'Urgent' : 'Planned'}
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-[#8585E3]/10 p-3 rounded-xl group-hover:bg-[#8585E3] group-hover:text-white transition-all duration-500 text-[#8585E3]">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-black text-slate-800 truncate max-w-[160px]">
                            {item.clientName || 'Standard Account'}
                          </h3>
                          <p className="text-[11px] font-bold text-[#4A7289]/60">
                            {item.serviceType || 'Service Renewal'}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5">
                          {/* Send email button */}
                          {item.clientId && (
                            <button
                              onClick={(e) => openModal(item, e)}
                              className="p-2 bg-[#8585E3]/10 hover:bg-[#8585E3] hover:text-white rounded-lg text-[#8585E3] shadow-sm border border-[#8585E3]/20 transition-all duration-200 active:scale-90"
                              title="Send alert email to client"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          )}
                          {/* Edit button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onEditClient?.(item); }}
                            className="p-2 bg-white hover:bg-[#8585E3] hover:text-white rounded-lg text-[#8585E3] shadow-sm border border-[#8585E3]/20 transition-all duration-200 active:scale-90"
                            title="Edit client details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">
                            {isOverdue
                              ? `${Math.abs(daysLeft)}d overdue`
                              : format(dueDate, 'EEE, d MMM yyyy')}
                          </p>
                          <p className="text-xs font-bold text-slate-700">{item.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-black italic tracking-tighter ${isOverdue ? 'text-red-600' : isUrgent ? 'text-red-500' : 'text-[#8585E3]'}`}>
                            {Math.abs(daysLeft)}<span className="text-[10px] not-italic ml-0.5">{isOverdue ? 'D OVR' : 'D'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                } catch {
                  return null;
                }
              })
            ) : (
              <div className="mx-6 w-full text-center py-6 bg-white/50 rounded-2xl border-2 border-dashed border-[#4A7289]/20">
                <p className="text-sm text-[#4A7289]/60 font-medium uppercase tracking-widest">No renewals scheduled</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── Modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(2, 8, 23, 0.75)', backdropFilter: 'blur(8px)' }}
          onClick={onBackdrop}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl"
            style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
          >
            {/* Modal top accent */}
            <div style={{ height: 5, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)' }} />

            {/* Modal header */}
            <div style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '24px 28px 20px' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', color: '#6366f1', marginBottom: 6, textTransform: 'uppercase' }}>
                    SEND CLIENT ALERT
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
                    {modal.clientName || 'Client'}
                  </div>
                  {modal.clientEmail && (
                    <div style={{ fontSize: 12, color: '#6366f1', marginTop: 4, fontWeight: 600 }}>
                      {modal.clientEmail}
                    </div>
                  )}
                </div>
                <button
                  onClick={closeModal}
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', borderRadius: 10, padding: '7px 8px', cursor: 'pointer', lineHeight: 1 }}
                  title="Close"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>

              {!result ? (
                <>
                  {/* Select types */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      Include in Email
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {Object.entries(TYPE_META).map(([key, meta]) => {
                        const isOn = types[key];
                        return (
                          <button
                            key={key}
                            onClick={() => toggleType(key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '12px 14px',
                              borderRadius: 12,
                              border: `2px solid ${isOn ? meta.color : '#e5e7eb'}`,
                              background: isOn ? meta.bg : '#f9fafb',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.15s ease',
                              outline: 'none',
                            }}
                          >
                            {/* Checkbox */}
                            <div style={{
                              width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                              background: isOn ? meta.color : '#fff',
                              border: `2px solid ${isOn ? meta.color : '#d1d5db'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}>
                              {isOn && (
                                <svg width="10" height="10" fill="none" stroke="#fff" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, marginBottom: 1 }}>{meta.icon}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: isOn ? meta.color : '#6b7280', lineHeight: 1.2 }}>
                                {meta.label}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedTypes.length === 0 && (
                      <div style={{ marginTop: 10, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                        Select at least one type to continue.
                      </div>
                    )}
                  </div>

                  {/* Days window */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                      Lookahead Window
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {WINDOW_OPTIONS.map(opt => {
                        const isSelected = daysWindow === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => setDaysWindow(opt.value)}
                            style={{
                              padding: '8px 16px', borderRadius: 999,
                              border: `2px solid ${isSelected ? '#6366f1' : '#e5e7eb'}`,
                              background: isSelected ? '#6366f1' : '#f9fafb',
                              color: isSelected ? '#fff' : '#6b7280',
                              fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', transition: 'all 0.15s',
                              outline: 'none',
                            }}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
                      Includes all items due within the next {daysWindow} days (plus any already overdue).
                    </div>
                  </div>

                  {/* Preview summary */}
                  <div style={{ background: '#f8faff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Email Preview
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                      Will send a branded TGNE alert to <strong>{modal.clientEmail || 'client email on file'}</strong> covering{' '}
                      <strong>{selectedTypes.map(t => TYPE_META[t]?.label).join(', ')}</strong>{' '}
                      due within <strong>{daysWindow} days</strong>.
                    </div>
                  </div>

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={sending || selectedTypes.length === 0}
                    style={{
                      width: '100%', padding: '14px',
                      borderRadius: 12,
                      border: 'none',
                      background: sending || selectedTypes.length === 0
                        ? '#e5e7eb'
                        : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                      color: sending || selectedTypes.length === 0 ? '#9ca3af' : '#fff',
                      fontSize: 14, fontWeight: 800,
                      cursor: sending || selectedTypes.length === 0 ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {sending ? (
                      <>
                        <Spinner />
                        Sending email...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Send Alert to Client
                      </>
                    )}
                  </button>
                </>
              ) : (
                /* ── Result state ── */
                <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
                  {result.ok ? (
                    <>
                      <div style={{ fontSize: 56, marginBottom: 12, lineHeight: 1 }}>
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                          <circle cx="32" cy="32" r="32" fill="#f0fdf4" />
                          <path d="M20 32l8 8 16-16" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Email Sent!</div>
                      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{result.message}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {result.alertCount} item{result.alertCount !== 1 ? 's' : ''} included in the alert.
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ marginBottom: 12 }}>
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: '0 auto', display: 'block' }}>
                          <circle cx="32" cy="32" r="32" fill="#fef2f2" />
                          <path d="M32 20v14M32 40v2" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>Not Sent</div>
                      <div style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, fontWeight: 600 }}>{result.message}</div>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
                    {!result.ok && (
                      <button
                        onClick={() => setResult(null)}
                        style={{ padding: '10px 20px', borderRadius: 10, border: '2px solid #6366f1', background: '#fff', color: '#6366f1', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={closeModal}
                      style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: result.ok ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9', color: result.ok ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                    >
                      {result.ok ? 'Done' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee { animation: marquee 40s linear infinite; }
        .pause-marquee   { animation-play-state: paused; }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.90) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </>
  );
};

// ── Tiny spinner ──────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg
    width="16" height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{ animation: 'spin 0.8s linear infinite' }}
  >
    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" />
    <path d="M8 2a6 6 0 016 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
);

export default DueReminders;
