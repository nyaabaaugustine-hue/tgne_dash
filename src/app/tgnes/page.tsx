"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ShieldAlert, ShieldCheck, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { verifyPin, isAuthorized } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized) {
      router.push('/');
    }
  }, [isAuthorized, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    // Artificial delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));

    if (verifyPin(pin)) {
      router.push('/');
    } else {
      setError(true);
      setPin('');
      setIsVerifying(false);
    }
  };

  const logoUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png";
  const bgUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776599742/upscaled_10x_back_ziilsg.png";

  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Premium Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={bgUrl} 
          alt="Security Background" 
          fill 
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/80 via-[#02040a]/40 to-[#02040a]/90" />
      </div>

      {/* Dynamic Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse z-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s] z-1" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="relative w-20 h-20 mb-6 group">
            <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl group-hover:bg-primary/50 transition-all duration-500" />
            <div className="relative w-full h-full bg-white rounded-2xl border border-white/20 p-3 shadow-2xl flex items-center justify-center overflow-hidden">
              <Image 
                src={logoUrl} 
                alt="TGNE Logo" 
                fill 
                className="object-contain p-2"
                priority
              />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter text-white text-center drop-shadow-lg">
            TGNE <span className="text-primary">SECURE</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-medium tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
            Authorized Personnel Only
          </p>
        </div>

        <Card className={cn(
          "glass-morphism border-white/10 bg-black/40 backdrop-blur-2xl overflow-hidden transition-all duration-300",
          error ? "border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.2)] animate-shake" : "shadow-2xl shadow-black/50"
        )}>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="flex justify-center mb-2">
                  {error ? (
                    <ShieldAlert className="text-red-500 animate-bounce" size={32} />
                  ) : isVerifying ? (
                    <Loader2 className="text-primary animate-spin" size={32} />
                  ) : (
                    <Lock className="text-primary/60" size={32} />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">Enter Security PIN</h2>
                <p className="text-xs text-muted-foreground">Access code required for dashboard entry</p>
              </div>

              <div className="relative group">
                <Input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    "h-14 bg-black/60 border-white/10 text-center text-2xl tracking-[1em] focus:ring-primary focus:border-primary transition-all duration-300 placeholder:tracking-normal",
                    error && "border-red-500/50 focus:ring-red-500 focus:border-red-500"
                  )}
                  autoFocus
                  disabled={isVerifying}
                />
              </div>

              {error && (
                <p className="text-red-400 text-[10px] font-bold text-center uppercase tracking-widest animate-in fade-in">
                  Access Denied. Please try again.
                </p>
              )}

              <Button 
                type="submit" 
                disabled={pin.length < 1 || isVerifying}
                className="w-full h-14 premium-button bg-primary hover:bg-primary/90 text-white font-bold text-lg group"
              >
                {isVerifying ? (
                  "Verifying Identity..."
                ) : (
                  <span className="flex items-center gap-2">
                    Initialize Session
                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 flex items-center justify-center gap-6 opacity-60 grayscale hover:grayscale-0 transition-all">
          <ShieldCheck size={20} className="text-white" />
          <div className="h-4 w-px bg-white/20" />
          <span className="text-[10px] text-white font-bold tracking-[0.2em] uppercase">AES-256 Simulated</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
