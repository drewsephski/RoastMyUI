"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { RoastForm } from '@/components/RoastForm';
import { RoastResult } from '@/components/RoastResult';
import { LoadingState } from '@/components/LoadingState';
import { Flame, MessageCircle, Repeat, Heart, BarChart2 } from 'lucide-react';
import Link from 'next/link';

interface RoastData {
  url: string;
  score: number;
  tagline: string;
  roast: string;
  shareText: string;
  strengths: string[];
  weaknesses: string[];
  sources: { title: string; uri: string }[];
  screenshot?: string;
}

const App: React.FC = () => {
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoastRequest = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setRoastData(null);

    try {
      const response = await fetch('/api/roast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate roast');
      }

      const data = await response.json();
      setRoastData(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Gemini refused to roast this (it was too powerful or the API broke). Try again.");
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

      <header className="w-full p-4 md:p-6 flex justify-between items-center z-10 border-b border-white/10 backdrop-blur-sm sticky top-0 bg-neutral-950/80">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <Flame className="w-5 h-5 md:w-6 md:h-6 text-rose-500" />
          <span className="font-bold text-base md:text-lg tracking-tight uppercase">Roast My UI</span>
        </div>
      </header>

      <main id="hero-section" className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 z-10 max-w-5xl mx-auto w-full mt-24">
        {isLoading ? (
          <LoadingState />
        ) : roastData ? (
          <RoastResult data={roastData} onReset={handleReset} />
        ) : (
          <div className="w-full max-w-6xl flex flex-col items-center text-center space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-500 pt-8 md:pt-0">
            <div className="space-y-4 md:space-y-6">
              <div className="inline-block border border-rose-500/30 bg-rose-500/10 px-3 py-1 rounded-full">
                <span className="text-rose-400 text-[10px] md:text-xs font-mono uppercase tracking-widest">
                  AI-Powered Design Critique
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9] pb-2">
                YOUR UI IS <br />
                <span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
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
              <div className="bg-black border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition duration-300 group text-left">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-700">
                    <span className="text-lg">💀</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm leading-tight">
                      <span className="font-bold text-white truncate">Roast My UI</span>
                      <span className="text-neutral-500 truncate">@roastmyui · 2h</span>
                    </div>
                    <p className="text-neutral-300 text-sm mt-1 leading-normal whitespace-pre-wrap">
                      <span className="font-black text-rose-500 text-base mr-1">3.87/10</span> ts aint tuff 💀 this site&apos;s design got me big mad fr 🔥 layout lookin mid af, color palette screams npc energy 🚩 typography hit different (wrong way) sybau spacing so whack it caught in 4k being whole mess 👀
                    </p>
                    <div className="flex justify-between items-center mt-3 text-neutral-500 max-w-[85%]">
                      <MessageCircle className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                      <Repeat className="w-4 h-4 hover:text-green-400 transition cursor-pointer" />
                      <Heart className="w-4 h-4 hover:text-rose-500 transition cursor-pointer" />
                      <BarChart2 className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-black border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition duration-300 group text-left">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-700">
                    <span className="text-lg">🤡</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm leading-tight">
                      <span className="font-bold text-white truncate">Roast My UI</span>
                      <span className="text-neutral-500 truncate">@roastmyui · 5h</span>
                    </div>
                    <p className="text-neutral-300 text-sm mt-1 leading-normal whitespace-pre-wrap">
                      <span className="font-black text-rose-500 text-base mr-1">4.15/10</span> ts a whole MESS 💀 Low-key mid website w/ zero vibe check passed 🚩 Spacing so trash it&apos;s giving NPC energy fr 🤡 UI lookin delulu af, contrast so bad it&apos;s caught in 4k of design crimes 😭
                    </p>
                    <div className="flex justify-between items-center mt-3 text-neutral-500 max-w-[85%]">
                      <MessageCircle className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                      <Repeat className="w-4 h-4 hover:text-green-400 transition cursor-pointer" />
                      <Heart className="w-4 h-4 hover:text-rose-500 transition cursor-pointer" />
                      <BarChart2 className="w-4 h-4 hover:text-blue-400 transition cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-black border border-neutral-800 p-4 rounded-xl hover:border-neutral-700 transition duration-300 group text-left">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-neutral-700">
                    <span className="text-lg">🗑️</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-sm leading-tight">
                      <span className="font-bold text-white truncate">Roast My UI</span>
                      <span className="text-neutral-500 truncate">@roastmyui · 1d</span>
                    </div>
                    <p className="text-neutral-300 text-sm mt-1 leading-normal whitespace-pre-wrap">
                      <span className="font-black text-rose-500 text-base mr-1">2.73/10</span> mid AF website caught in 4k with NPC lookin&apos; ass layout 🚨 ts aint tuff bruh—spacing more awkward than my dating life, contrast lower than my caffeine tolerance, typography screaming touch grass rn 💀
                    </p>
                    <div className="flex justify-between items-center mt-3 text-neutral-500 max-w-[85%]">
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
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />

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
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="order-1 lg:order-2 relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-rose-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                <Image
                  src="/product-image.png"
                  alt="Roast My UI Product Screenshot"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
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
    </div>
  );
};

export default App;