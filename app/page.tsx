/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { RoastForm } from '@/components/RoastForm';
import { RoastResult } from '@/components/RoastResult';
import { LoadingState } from '@/components/LoadingState';
import { ClientTweetCard as TweetCard } from '@/components/ui/tweet-card';
import { Flame, Coins, Plus } from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useClerk } from "@clerk/nextjs";
import { getUserCredits, generateRoast, type RoastData } from './actions';
import { PricingModal } from '@/components/PricingModal';
import { PaymentSuccessHandler } from '@/components/PaymentSuccessHandler';
import { Suspense } from 'react';

const App: React.FC = () => {
  const { isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
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

  const handleRoastRequest = async (url: string, analysisType: 'hero' | 'full-page') => {
    if (isLoaded && !isSignedIn) {
      clerk.openSignUp();
      return;
    }

    setIsLoading(true);
    setError(null);
    setRoastData(null);

    try {
      const data = await generateRoast(url, analysisType);
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

      <header className="w-full p-3 sm:p-4 md:p-6 flex justify-between items-center z-50 border-b border-white/5 backdrop-blur-xl sticky top-0 bg-neutral-950/80 supports-backdrop-filter:bg-neutral-950/50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <Flame className="w-6 h-6 md:w-6 md:h-6 text-rose-500" />
          <span className="font-bold text-sm sm:text-base md:text-lg tracking-tight uppercase">Roast My UI</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <a
            href="https://www.producthunt.com/products/roast-my-ui?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-roast&#0045;my&#0045;ui"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:block"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1043582&theme=light&t=1764340623680"
              alt="Roast&#0032;My&#0032;UI - Paste&#0032;a&#0032;URL&#0032;→&#0032;instant&#0032;AI&#0032;roast&#0032;with&#0032;actionable&#0032;fixes | Product Hunt"
              style={{ width: '200px', height: '43px' }}
              width="200"
              height="43"
            />
          </a>
          <SignedIn>
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1.5 bg-neutral-900/80 backdrop-blur-sm rounded-full border border-neutral-800/80 shadow-lg shadow-black/20">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
              <span className="text-xs sm:text-sm font-mono font-semibold text-white min-w-[20px] sm:min-w-[24px] text-center">{credits !== null ? credits : '...'}</span>
              <button
                onClick={() => setIsPricingOpen(true)}
                className="ml-0.5 sm:ml-1 p-1.5 sm:p-1.5 hover:bg-rose-500/20 active:bg-rose-500/30 bg-neutral-800/50 rounded-full transition-all text-rose-500 active:scale-95 hover:scale-110 border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-center"
                title="Buy Credits"
                aria-label="Buy Credits"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
              </button>
            </div>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-black text-xs sm:text-sm font-bold rounded-full hover:bg-neutral-200 transition active:scale-95">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      <main id="hero-section" className="grow flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 z-10 max-w-5xl mx-auto w-full mt-16 sm:mt-20 md:mt-24">
        {isLoading ? (
          <LoadingState />
        ) : roastData ? (
          <RoastResult data={roastData} onReset={handleReset} />
        ) : (
          <div className="w-full max-w-6xl flex flex-col items-center text-center space-y-6 sm:space-y-8 md:space-y-12 animate-in fade-in zoom-in duration-500 pt-4 sm:pt-6 md:pt-0">
            <div className="space-y-4 sm:space-y-6 md:space-y-8 px-2">
              <div className="inline-flex items-center gap-2 border border-rose-500/30 bg-rose-500/10 px-3 sm:px-4 py-2 sm:py-1.5 rounded-full backdrop-blur-md shadow-lg shadow-rose-500/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
                <span className="text-rose-300 text-xs sm:text-[10px] md:text-xs font-medium uppercase tracking-widest">
                  AI-Powered Design Analysis
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold tracking-tighter leading-[0.95] sm:leading-[0.9] pb-2 sm:pb-4">
                <span className="block text-white" style={{
                  textShadow: '0 2px 20px rgba(255,255,255,0.4), 0 0 40px rgba(255,255,255,0.2), 0 4px 8px rgba(0,0,0,0.8)'
                }}>
                  YOUR UI IS
                </span>
                <span className="block mt-2 sm:mt-1 text-transparent bg-clip-text bg-linear-to-r from-rose-400 via-rose-500 to-purple-500 drop-shadow-[0_0_40px_rgba(244,63,94,0.6)] filter brightness-125" style={{
                  WebkitTextStroke: '1px rgba(244,63,94,0.3)',
                  textShadow: '0 0 30px rgba(244,63,94,0.4), 0 0 15px rgba(244,63,94,0.3)'
                }}>
                  PROBABLY MID.
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-xl text-neutral-300 sm:text-neutral-400 max-w-lg mx-auto font-light px-4 leading-relaxed">
                Paste your URL. We will analyze your spacing, color theory, and life choices.
                <span className="block mt-3 sm:mt-2 text-rose-400 sm:text-rose-500 font-mono text-xs sm:text-xs md:text-sm font-semibold sm:font-normal opacity-90 sm:opacity-80">
                  ZERO MERCY. NO CAP.
                </span>
              </p>
            </div>

            <div className="w-full px-2 sm:px-4 md:px-0">
              <RoastForm onSubmit={handleRoastRequest} />
              {error && (
                <div className="mt-4 p-3 sm:p-4 border border-red-500/50 bg-red-900/20 text-red-200 font-mono text-xs sm:text-sm rounded-lg">
                  <span className="font-bold">ERROR:</span> {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-8 sm:pt-10 md:pt-12 w-full px-2">
              <TweetCard
                avatar="💀"
                name="Roast My UI"
                handle="roastmyui"
                time="2h"
                content={
                  <span>
                    <span className="font-bold text-rose-400 text-base mr-1">3.87/10</span> ts aint tuff 💀 this site&apos;s design got me big mad fr 🔥 layout lookin mid af, color palette screams npc energy 🚩 typography hit different (wrong way)
                  </span>
                }
                metrics={{
                  replies: "42",
                  reposts: "12",
                  likes: "156",
                  views: "1.2k"
                }}
              />
              <TweetCard
                avatar="🗑️"
                name="Roast My UI"
                handle="roastmyui"
                time="1d"
                content={
                  <span>
                    <span className="font-bold text-rose-400 text-base mr-1">2.73/10</span> mid AF website caught in 4k with NPC lookin&apos; ass layout 🚨 ts aint tuff bruh—spacing more awkward than my dating life
                  </span>
                }
                metrics={{
                  replies: "156",
                  reposts: "84",
                  likes: "1.5k",
                  views: "12k"
                }}
              />
              <TweetCard
                avatar="🤡"
                name="Roast My UI"
                handle="roastmyui"
                time="5h"
                content={
                  <span>
                    <span className="font-bold text-rose-400 text-base mr-1">4.15/10</span> ts a whole MESS 💀 Low-key mid website w/ zero vibe check passed 🚩 Spacing so trash it&apos;s giving NPC energy fr 🤡 UI lookin delulu af
                  </span>
                }
                metrics={{
                  replies: "28",
                  reposts: "5",
                  likes: "89",
                  views: "850"
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Product Showcase Section */}
      <section className="w-full py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 z-10 border-t border-white/10 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-neutral-950 via-neutral-900 to-neutral-950 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
            {/* Left: Text Content */}
            <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">
              <div className="inline-block border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 rounded-full">
                <span className="text-rose-400 text-xs font-mono uppercase tracking-widest">
                  Why We Exist
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight leading-tight">
                LinkedIn is fake. Your friends are too nice to tell you that your landing page makes no sense.
              </h2>

              <div className="space-y-3 sm:space-y-4 text-neutral-300 text-sm sm:text-base md:text-lg leading-relaxed">
                <p>
                  So we built <span className="text-white font-semibold">Roast My UI</span>. An AI Agent with only one directive:{' '}
                  <br />
                  <span className="my-4 sm:my-6 text-center mx-auto flex justify-center text-rose-500 font-bold text-xl sm:text-2xl">Choose Violence. ☠️</span>
                </p>

                <p>
                  It browses your site, parses your copy, analyzes your design, and generates a roast so brutal you might actually pivot.
                </p>

                <p className="text-white font-semibold">
                  Drop your link. Get destroyed. Don&apos;t say we didn&apos;t warn you.
                </p>
              </div>

              {/* Optional CTA */}
              <div className="pt-2 sm:pt-4">
                <button
                  onClick={() => {
                    handleReset();
                    scrollToHero();
                  }}
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] active:scale-95 text-sm sm:text-base"
                >
                  <span className="relative z-10">Try It Now</span>
                  <div className="absolute inset-0 bg-linear-to-r from-rose-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="order-1 lg:order-2 relative group perspective-1000">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-linear-to-r from-rose-500 to-purple-600 rounded-2xl blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />

              {/* Main Image Container */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_80px_-20px_rgba(244,63,94,0.3)] transition-all duration-700 transform group-hover:scale-[1.02] group-hover:rotate-1 bg-neutral-900">

                {/* Shine Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-20 pointer-events-none" />

                <Image
                  src="/product-image-1.png"
                  alt="Roast My UI Product Screenshot"
                  width={1200}
                  height={800}
                  className="w-full h-auto relative z-10"
                  priority
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-neutral-950/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full p-4 sm:p-5 md:p-6 text-center z-10 border-t border-white/5">
        <p className="text-neutral-600 text-[10px] sm:text-xs font-mono leading-relaxed">
          © {new Date().getFullYear()} ROAST MY UI LABS. DO NOT TAKE THIS PERSONALLY.
          <span className="block sm:inline">&nbsp;<span className="hidden sm:inline">|</span>&nbsp;</span>
          <Link href="/privacy" className="text-rose-500 hover:underline active:text-rose-400">Privacy Policy</Link>
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