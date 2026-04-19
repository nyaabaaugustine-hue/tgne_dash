"use client";

import { useApp } from "@/lib/store";
import { Loader2, Sparkles } from "lucide-react";

export function SavingIndicator() {
  const { isSaving } = useApp();

  if (!isSaving) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-full shadow-lg border border-white/20">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm font-semibold tracking-wide">Premium Saving</span>
      </div>
    </div>
  );
}

export function PremiumSavingOverlay() {
  const { isSaving } = useApp();

  if (!isSaving) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm animate-in fade-in">
      <div className="flex flex-col items-center gap-4 p-8 bg-card rounded-2xl shadow-2xl border-2 border-primary/20">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-yellow-500 animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-foreground">Securing Your Data</p>
          <p className="text-sm text-muted-foreground">Premium encryption in progress...</p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}