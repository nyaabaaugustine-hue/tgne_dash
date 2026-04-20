import React from 'react';
import rollbar from './rollbar';
import { intlFormatDistance, differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * DueReminders Component
 * Features: Smooth auto-scrolling marquee, vibrant accents, and date-based scheduling.
 */
const DueReminders = ({ reminders = [], onEditClient }) => {
  // Doubling the array ensures a seamless infinite scroll loop
  const scrollItems = [...reminders, ...reminders];

  return (
    <div className="w-full py-8 bg-[#ECF1F3] font-['Inter',_sans-serif] overflow-hidden">
      <div className="px-6 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#4A7289] tracking-tight flex items-center gap-2">
          <span className="w-2 h-6 bg-[#8585E3] rounded-full inline-block"></span>
          Renewal Schedule
        </h2>
        <span className="text-xs font-bold text-white bg-[#8585E3] px-3 py-1 rounded-full shadow-sm shadow-[#8585E3]/30">
          {reminders.length} ACTIVE
        </span>
      </div>

      {/* Marquee Animation Container */}
      <div className="relative w-full overflow-hidden">
        <div className="flex w-max animate-marquee hover:pause-marquee py-4">
          {reminders.length > 0 ? (
            scrollItems.map((item, index) => {
              try {
                const dueDate = parseISO(item.dueDate);
                const today = new Date();
                const daysLeft = item.daysLeft ?? differenceInCalendarDays(dueDate, today);
                const relativeString = intlFormatDistance(dueDate, today, { numeric: 'auto' });
                const isUrgent = daysLeft <= 7;

                return (
                  <div 
                    key={`${item.id}-${index}`}
                    className="mx-3 min-w-[300px] bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(133,133,227,0.15)] hover:-translate-y-1 cursor-pointer relative overflow-hidden group"
                  >
                    {/* Dynamic Status Indicator */}
                    <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-bl-xl ${isUrgent ? 'bg-red-500 text-white' : 'bg-[#ECF1F3] text-[#4A7289]'}`}>
                      {isUrgent ? 'Urgent' : 'Planned'}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-[#8585E3]/10 p-3 rounded-xl group-hover:bg-[#8585E3] group-hover:text-white transition-all duration-500 text-[#8585E3]">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-800 truncate max-w-[180px]">
                          {item.clientName || 'Standard Account'}
                        </h3>
                        <p className="text-[11px] font-bold text-[#4A7289]/60">
                          {item.serviceType || 'Service Renewal'}
                        </p>
                      </div>
                      {/* Quick Edit Action */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClient?.(item);
                        }}
                        className="ml-auto p-2 bg-white hover:bg-[#8585E3] hover:text-white rounded-lg text-[#8585E3] shadow-sm border border-[#8585E3]/20 transition-all duration-200 active:scale-90"
                        title="Edit Client Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 leading-none">
                          {relativeString}
                        </p>
                        <p className="text-xs font-bold text-slate-700">
                          {item.dueDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-black italic tracking-tighter ${isUrgent ? 'text-red-500' : 'text-[#8585E3]'}`}>
                          {daysLeft}<span className="text-[10px] not-italic ml-1">DAYS</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } catch (err) {
                rollbar.error("Marquee Item Render Failure", err);
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

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .pause-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default DueReminders;