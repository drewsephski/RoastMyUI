"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { RoastForm } from '@/components/RoastForm';
import { RoastResult } from '@/components/RoastResult';
import { LoadingState } from '@/components/LoadingState';
import { Flame, MessageCircle, Repeat, Heart, BarChart2, Coins, Plus } from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { getUserCredits, generateRoast } from './actions';
import { PricingModal } from '@/components/PricingModal';
import { PaymentSuccessHandler } from '@/components/PaymentSuccessHandler';
import { Suspense } from 'react';

interface RoastData {
  url: string;
  score: number;
  tagline: string;
  roast: string;
  shareText: string;
  strengths: string[];
  sources: { title: string; uri: string }[];
  weaknesses: string[];
  screenshot?: string;
  remainingCredits?: number;
}

const App: React.FC = () => {
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  useEffect(() => {
    getUserCredits().then(setCredits);
  }, []);

  const refreshCredits = async () => {
    const latestCredits = await getUserCredits();
    setCredits(latestCredits);
  };

  const handleRoastRequest = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setRoastData(null);

    try {
      const data = await generateRoast(url);
      setRoastData(data);
      if (typeof data.remainingCredits === 'number') {
        setCredits(data.remainingCredits);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Gemini refused to roast this (it was too powerful or the API broke). Try again.";
      setError(errorMessage);

      if (errorMessage.includes("Insufficient credits")) {
        setIsPricingOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRoastData(null);
    setError(null);
  };

  const scrollToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-neutral-950 text-white selection:bg-rose-500 selection:text-white">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/20 blur-[100px] rounded-full pointer-events-none" />

      <header className="w-full p-4 md:p-6 flex justify-between items-center z-50 border-b border-white/5 backdrop-blur-xl sticky top-0 bg-neutral-950/50 supports-[backdrop-filter]:bg-neutral-950/20">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <Flame className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
          <span className="font-bold text-base md:text-lg tracking-tight uppercase">Roast My UI</span>
        </div>
        <div className="flex items-center gap-4">
          <SignedIn>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 rounded-full border border-neutral-800">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-mono text-neutral-300">{credits !== null ? credits : '...'} Credits</span>
              <button
                onClick={() => setIsPricingOpen(true)}
                className="ml-2 p-1 hover:bg-neutral-800 rounded-full transition text-rose-500"
                title="Buy Credits"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main id="hero-section" className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 z-10 max-w-5xl mx-auto w-full mt-24">
        {isLoading ? (
          <LoadingState />
        ) : roastData ? (
          <RoastResult data={roastData} onReset={handleReset} />
        ) : (
          <div className="w-full max-w-6xl flex flex-col items-center text-center space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-500 pt-8 md:pt-0">
            <div className="space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 border border-rose-500/20 bg-rose-500/5 px-4 py-1.5 rounded-full backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-rose-300 text-[10px] md:text-xs font-medium uppercase tracking-widest">
                  AI-Powered Design Analysis
                </span>
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9] pb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-neutral-500">
                YOUR UI IS <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-purple-600 drop-shadow-[0_0_30px_rgba(225,29,72,0.3)]">
                  PROBABLY MID.
                </span>
              </h1>
              <p className="text-base md:text-xl text-neutral-400 max-w-lg mx-auto font-light px-4">
                Paste your URL. We will analyze your spacing, color theory, and life choices.
                <span className="block mt-2 text-rose-500 font-mono text-xs md:text-sm opacity-80">
                  ZERO MERCY. NO CAP.
                </span>
              </p>
            </div>

            <div className="w-full px-2 md:px-0">
              <RoastForm onSubmit={handleRoastRequest} />
              {error && (
                <div className="mt-4 p-4 border border-red-500/50 bg-red-900/10 text-red-200 font-mono text-xs md:text-sm">
                  ERROR: {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 w-full">
              {/* Card 1 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-rose-500/30 transition duration-500 group text-left hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:-translate-y-1">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900/50 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-inner">
                    <span className="text-xl">💀</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm leading-tight mb-1">
                      <span className="font-bold text-white truncate">Roast My UI</span>
                      <span className="text-neutral-500 text-xs">@roastmyui · 2h</span>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                      <span className="font-bold text-rose-400 text-base mr-1">3.87/10</span> ts aint tuff 💀 this site&apos;s design got me big mad fr 🔥 layout lookin mid af, color palette screams npc energy 🚩 typography hit different (wrong way)
                    </p>
                    <div className="flex justify-between items-center mt-4 text-neutral-600 max-w-[85%]">
                      <MessageCircle className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                      <Repeat className="w-4 h-4 hover:text-green-400 transition cursor-pointer" />
                      <Heart className="w-4 h-4 hover:text-rose-500 transition cursor-pointer" />
                      <BarChart2 className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-rose-500/30 transition duration-500 group text-left hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:-translate-y-1">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900/50 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                    <span className="text-xl">🤡</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm leading-tight mb-1">
                      <span className="font-bold text-white truncate">Roast My UI</span>
                      <span className="text-neutral-500 text-xs">@roastmyui · 5h</span>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                      <span className="font-bold text-rose-400 text-base mr-1">4.15/10</span> ts a whole MESS 💀 Low-key mid website w/ zero vibe check passed 🚩 Spacing so trash it&apos;s giving NPC energy fr 🤡 UI lookin delulu af
                    </p>
                    <div className="flex justify-between items-center mt-4 text-neutral-600 max-w-[85%]">
                      <MessageCircle className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                      <Repeat className="w-4 h-4 hover:text-green-400 transition cursor-pointer" />
                      <Heart className="w-4 h-4 hover:text-rose-500 transition cursor-pointer" />
                      <BarChart2 className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:border-rose-500/30 transition duration-500 group text-left hover:shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:-translate-y-1">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-neutral-900/50 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                    <span className="text-xl">🗑️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm leading-tight mb-1">
                      <span className="font-bold text-white truncate">Roast My UI</span>
                      <span className="text-neutral-500 text-xs">@roastmyui · 1d</span>
                    </div>
                    <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                      <span className="font-bold text-rose-400 text-base mr-1">2.73/10</span> mid AF website caught in 4k with NPC lookin&apos; ass layout 🚨 ts aint tuff bruh—spacing more awkward than my dating life
                    </p>
                    <div className="flex justify-between items-center mt-4 text-neutral-600 max-w-[85%]">
                      <MessageCircle className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                      <Repeat className="w-4 h-4 hover:text-green-400 transition cursor-pointer" />
                      <Heart className="w-4 h-4 hover:text-rose-500 transition cursor-pointer" />
                      <BarChart2 className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Product Showcase Section */}
      <section className="w-full py-16 md:py-24 px-4 md:px-8 z-10 border-t border-white/10 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="inline-block border border-rose-500/30 bg-rose-500/10 px-3 py-1 rounded-full">
                <span className="text-rose-400 text-xs font-mono uppercase tracking-widest">
                  Why We Exist
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                LinkedIn is fake. Your friends are too nice to tell you that your landing page makes no sense.
              </h2>

              <div className="space-y-4 text-neutral-300 text-base md:text-lg leading-relaxed">
                <p>
                  So we built <span className="text-white font-semibold">Roast My UI</span>. An AI Agent with only one directive:{' '}
                  <br />
                  <span className="my-6 text-center mx-auto flex justify-center text-rose-500 font-bold text-2xl">Choose Violence. ☠️</span>
                </p>

                <p>
                  It browses your site, parses your copy, analyzes your design, and generates a roast so brutal you might actually pivot.
                </p>

                <p className="text-white font-semibold">
                  Drop your link. Get destroyed. Don&apos;t say we didn&apos;t warn you.
                </p>
              </div>

              {/* Optional CTA */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    handleReset();
                    scrollToHero();
                  }}
                  className="group relative px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(244,63,94,0.5)]"
                >
                  <span className="relative z-10">Try It Now</span>
                  <div className="absolute inset-0 bg-linear-to-r from-rose-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="order-1 lg:order-2 relative group perspective-1000">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-rose-500 to-purple-600 rounded-2xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />

              {/* Main Image Container */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_80px_-20px_rgba(244,63,94,0.3)] transition-all duration-700 transform group-hover:scale-[1.02] group-hover:rotate-1 bg-neutral-900">

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-20 pointer-events-none" />

                <Image
                  src="/product-image.png"
                  alt="Roast My UI Product Screenshot"
                  width={1200}
                  height={800}
                  className="w-full h-auto relative z-10"
                  priority
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full p-4 md:p-6 text-center z-10 border-t border-white/5">
        <p className="text-neutral-600 text-[10px] md:text-xs font-mono">
          © {new Date().getFullYear()} ROAST MY UI LABS. DO NOT TAKE THIS PERSONALLY.
          &nbsp;|&nbsp;
          <Link href="/privacy" className="text-rose-500 hover:underline">Privacy Policy</Link>
        </p>
      </footer>

      <PricingModal isOpen={isPricingOpen} onClose={() => {
        setIsPricingOpen(false);
        refreshCredits(); // Refresh credits when modal closes
      }} />

      <Suspense fallback={null}>
        <PaymentSuccessHandler onCreditsUpdated={(newCredits) => setCredits(newCredits)} />
      </Suspense>
    </div>
  );
};

export default App;