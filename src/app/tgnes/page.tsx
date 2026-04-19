"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { ShieldAlert, Lock, ArrowRight, Loader2, CheckCircle2, Fingerprint, Sparkles } from 'lucide-react';
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

    await new Promise(resolve => setTimeout(resolve, 1200));

    if (verifyPin(pin)) {
      setIsSuccess(true);
      setIsVerifying(false);
      setTimeout(() => {
        router.push('/');
      }, 1800);
    } else {
      setError(true);
      setPin('');
      setIsVerifying(false);
    }
  };

  const logoUrl = "https://res.cloudinary.com/dwsl2ktt2/image/upload/v1776598078/download_kangs7.png";

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-400 via-purple-500 to-pink-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Vibrant Background Shapes */}
      <div className="absolute top-10 left-10 w-40 h-40 bg-yellow-300 rounded-full blur-xl opacity-60 animate-bounce" />
      <div className="absolute bottom-20 right-10 w-60 h-60 bg-cyan-300 rounded-full blur-xl opacity-50 animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-orange-300 rounded-full blur-lg opacity-40 animate-pulse [animation-delay:1s]" />
      <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-green-300 rounded-full blur-lg opacity-50 animate-bounce [animation-delay:0.5s]" />
      
      {/* Floating Icons */}
      <div className="absolute top-20 right-20 text-white/30 animate-spin" style={{ animationDuration: '8s' }}>
        <Sparkles size={40} />
      </div>
      <div className="absolute bottom-32 left-16 text-white/20 animate-spin" style={{ animationDuration: '12s' }}>
        <Sparkles size={30} />
      </div>

      {/* Main Card */}
      <Card className={cn(
        "w-full max-w-md relative z-10 transition-all duration-500",
        "bg-white/90 backdrop-blur-xl border-0 shadow-2xl",
        error && "animate-shake",
        isSuccess && "border-2 border-green-400"
      )}>
        <CardContent className="p-10">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-pink-500 rounded-3xl blur-md opacity-40" />
              <div className="relative w-full h-full bg-white rounded-3xl flex items-center justify-center shadow-lg border border-gray-100">
                <Image 
                  src={logoUrl} 
                  alt="TGNE" 
                  fill 
                  className="object-contain p-4"
                />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
              TGNE
            </h1>
            <p className="text-gray-500 text-sm mt-1 font-medium">Admin Dashboard</p>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={cn(
              "p-5 rounded-full transition-all duration-300 shadow-md",
              isSuccess ? "bg-green-100" : error ? "bg-red-100" : "bg-gradient-to-br from-violet-100 to-pink-100"
            )}>
              {isSuccess ? (
                <CheckCircle2 className="text-green-500" size={36} />
              ) : error ? (
                <ShieldAlert className="text-red-500" size={36} />
              ) : isVerifying ? (
                <Loader2 className="text-violet-600 animate-spin" size={36} />
              ) : (
                <Fingerprint className="text-pink-500" size={36} />
              )}
            </div>
          </div>

          {/* Status */}
          <p className={cn(
            "text-center text-base font-medium mb-8",
            isSuccess ? "text-green-600" : error ? "text-red-500" : "text-gray-600"
          )}>
            {isSuccess ? "Access Granted!" : 
             error ? "Wrong PIN. Try again" : 
             isVerifying ? "Verifying..." : "Enter your PIN to continue"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••••••"
              className={cn(
                "h-14 bg-gray-50 border-2 border-gray-200 text-gray-900 text-center text-2xl tracking-[0.5em] font-mono placeholder:text-gray-400",
                "focus:ring-2 focus:ring-violet-500 focus:border-violet-500",
                error && "border-red-300 focus:ring-red-400 focus:border-red-400",
                isSuccess && "border-green-400",
                "rounded-xl"
              )}
              autoFocus
              disabled={isVerifying || isSuccess}
            />

            <Button 
              type="submit" 
              disabled={pin.length < 1 || isVerifying || isSuccess}
              className={cn(
                "w-full h-14 text-base font-bold transition-all duration-300 rounded-xl shadow-lg",
                isSuccess ? "bg-green-500 hover:bg-green-600 text-white" : 
                error ? "bg-red-500 hover:bg-red-600 text-white" :
                "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white",
                isVerifying && "opacity-70"
              )}
            >
              {isVerifying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </span>
              ) : isSuccess ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={20} />
                  Welcome!
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Unlock
                  <ArrowRight size={20} />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-gray-400 text-xs">
            <p>Protected by TGNE Security</p>
          </div>
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.35s ease-in-out;
        }
      `}</style>
    </div>
  );
}