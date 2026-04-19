"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ShieldAlert, ShieldCheck, Lock, ArrowRight, Loader2, Zap, CheckCircle2, Fingerprint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminPinPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { verifyPin, isAuthorized } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (isAuthorized && !isSuccess) {
      router.push('/');
    }
  }, [isAuthorized, router, isSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    await new Promise(resolve => setTimeout(resolve, 1500));

    if (verifyPin(pin)) {
      setIsSuccess(true);
      setIsVerifying(false);
      setTimeout(() => {
        router.push('/');
      }, 2000);
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
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={bgUrl} 
          alt="Background" 
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-[100px] animate-pulse [animation-delay:2s]" />

      {/* Success Banner */}
      <div className={cn(
        "fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-700 ease-out flex items-center gap-3 px-5 py-3 rounded-full border bg-black/90 backdrop-blur-xl shadow-[0_0_40px_rgba(16,185,129,0.4)] border-emerald-500/60",
        isSuccess ? "translate-y-0 opacity-100" : "-translate-y-24 opacity-0"
      )}>
        <CheckCircle2 className="text-emerald-400" size={20} />
        <span className="text-emerald-400 font-bold text-sm tracking-wide">ACCESS GRANTED</span>
      </div>

      {/* Main Card */}
      <Card className={cn(
        "w-full max-w-md relative z-10 transition-all duration-700",
        "bg-white/5 backdrop-blur-2xl border-white/10",
        error ? "animate-shake border-red-500/30" : "shadow-[0_25px_60px_rgba(0,0,0,0.5)]",
        isSuccess && "border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
      )}>
        <CardContent className="p-8 sm:p-12">
          {/* Logo Section */}
          <div className="text-center mb-10">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-500 rounded-2xl blur-lg opacity-50" />
              <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl">
                <Image 
                  src={logoUrl} 
                  alt="TGNE" 
                  fill 
                  className="object-contain p-3"
                />
              </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">
              TGNE <span className="text-primary">CORE</span>
            </h1>
            <p className="text-white/50 text-xs mt-2 tracking-[0.3em] uppercase">Admin Access</p>
          </div>

          {/* Icon Indicator */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "p-4 rounded-2xl transition-all duration-500",
              isSuccess ? "bg-emerald-500/20" : error ? "bg-red-500/20" : "bg-white/10"
            )}>
              {isSuccess ? (
                <CheckCircle2 className="text-emerald-400" size={32} />
              ) : error ? (
                <ShieldAlert className="text-red-400" size={32} />
              ) : isVerifying ? (
                <Loader2 className="text-white animate-spin" size={32} />
              ) : (
                <Fingerprint className="text-white/70" size={32} />
              )}
            </div>
          </div>

          {/* Status Text */}
          <p className={cn(
            "text-center text-sm mb-8 transition-colors duration-300",
            isSuccess ? "text-emerald-400" : error ? "text-red-400" : "text-white/60"
          )}>
            {isSuccess ? "Verified • Redirecting..." : 
             error ? "Invalid PIN • Try again" : 
             isVerifying ? "Verifying..." : "Enter your PIN code"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••••"
                className={cn(
                  "h-14 bg-white/5 border-white/10 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/30 placeholder:tracking-normal",
                  "focus:ring-2 focus:ring-primary focus:border-primary/50",
                  error && "border-red-500/50 focus:ring-red-500",
                  isSuccess && "border-emerald-500/50",
                  "rounded-xl"
                )}
                autoFocus
                disabled={isVerifying || isSuccess}
              />
            </div>

            <Button 
              type="submit" 
              disabled={pin.length < 1 || isVerifying || isSuccess}
              className={cn(
                "w-full h-12 font-semibold transition-all duration-300",
                isSuccess ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90",
                isVerifying && "opacity-50 cursor-wait"
              )}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2 justify-center">
                  <Loader2 className="animate-spin" size={18} />
                  Verifying...
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2 justify-center">
                  <CheckCircle2 size={18} />
                  Welcome Back
                </span>
              ) : (
                <span className="flex items-center gap-2 justify-center">
                  Unlock Dashboard
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Security Badge */}
          <div className="mt-8 flex items-center justify-center gap-4 text-white/30">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} />
              <span className="text-[10px] uppercase tracking-wider">Secure</span>
            </div>
            <div className="h-3 w-[1px] bg-white/20" />
            <div className="flex items-center gap-1.5">
              <Lock size={12} />
              <span className="text-[10px] uppercase tracking-wider">Encrypted</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}