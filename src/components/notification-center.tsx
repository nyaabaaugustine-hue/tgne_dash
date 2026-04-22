"use client";

/**
 * src/components/notification-center.tsx
 * Bell icon with a dropdown showing unread reminders and overdue items.
 */

import React, { useState, useMemo } from 'react';
import { Bell, X, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/store';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function NotificationCenter() {
  const { data, markReminderRead } = useApp();
  const [open, setOpen] = useState(false);

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items: { id: string; label: string; sub: string; urgency: 'overdue' | 'urgent' | 'soon'; type: 'reminder' | 'domain' | 'task' }[] = [];

    // Unread reminders
    data.reminders.filter(r => !r.isRead).forEach(r => {
      let d = 999;
      try { d = differenceInCalendarDays(parseISO(r.date), today); } catch {}
      items.push({
        id:      r.id,
        label:   r.title,
        sub:     `${r.type} · ${r.date}`,
        urgency: d < 0 ? 'overdue' : d <= 7 ? 'urgent' : 'soon',
        type:    'reminder',
      });
    });

    // Expiring domains (within 14 days)
    data.websites.filter(w => w.expiryDate).forEach(w => {
      let d = 999;
      try { d = differenceInCalendarDays(parseISO(w.expiryDate!), today); } catch {}
      if (d > 14) return;
      const client = data.clients.find(c => c.id === w.clientId);
      items.push({
        id:      `site-${w.id}`,
        label:   `${w.domainName} expiring`,
        sub:     `${client?.businessName ?? ''} · ${d < 0 ? 'EXPIRED' : `${d}d left`}`,
        urgency: d < 0 ? 'overdue' : d <= 3 ? 'urgent' : 'soon',
        type:    'domain',
      });
    });

    return items.sort((a, b) => {
      const order = { overdue: 0, urgent: 1, soon: 2 };
      return order[a.urgency] - order[b.urgency];
    });
  }, [data]);

  const count = notifications.length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative text-muted-foreground hover:text-primary rounded-full transition-colors"
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-50 w-80 bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <p className="text-sm font-bold">Notifications</p>
              <div className="flex items-center gap-2">
                {count > 0 && (
                  <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-black px-2">
                    {count} new
                  </Badge>
                )}
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <CheckCircle2 size={24} className="text-emerald-500" />
                  <p className="text-sm font-semibold">All clear!</p>
                  <p className="text-xs">No pending notifications.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer',
                    )}
                    onClick={() => {
                      if (n.type === 'reminder') {
                        markReminderRead(n.id);
                      }
                    }}
                  >
                    <div className={cn(
                      'p-1.5 rounded-lg flex-shrink-0 mt-0.5',
                      n.urgency === 'overdue' ? 'bg-red-500/10 text-red-500' :
                      n.urgency === 'urgent'  ? 'bg-orange-500/10 text-orange-500' :
                                                'bg-amber-500/10 text-amber-500'
                    )}>
                      {n.urgency === 'overdue'
                        ? <AlertTriangle size={13} />
                        : <Calendar size={13} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-foreground truncate">{n.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.sub}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] font-black flex-shrink-0 px-1.5',
                        n.urgency === 'overdue' ? 'border-red-400/30 text-red-600 bg-red-500/10' :
                        n.urgency === 'urgent'  ? 'border-orange-400/30 text-orange-600 bg-orange-500/10' :
                                                  'border-amber-400/30 text-amber-600 bg-amber-500/10'
                      )}>
                      {n.urgency.toUpperCase()}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
