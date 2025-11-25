"use client";

import React, { useState } from 'react';
import { RoastForm } from './components/RoastForm';
import { RoastResult } from './components/RoastResult';
import { LoadingState } from './components/LoadingState';
import { generateRoast, RoastData } from './services/geminiService';
import { ExternalLink, Flame } from 'lucide-react';

const App: React.FC = () => {
  const [roastData, setRoastData] = useState<RoastData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoastRequest = async (url: string) => {
    setIsLoading(true);
    setError(null);
    setRoastData(null);

    try {
      const data = await generateRoast(url);
      setRoastData(data);
    } catch (err) {
      console.error(err);
      setError("Gemini refused to roast this (it was too powerful or the API broke). Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setRoastData(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-neutral-950 text-white selection:bg-rose-500 selection:text-white">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/20 blur-[100px] rounded-full pointer-events-none" />

      <header className="w-full p-6 flex justify-between items-center z-10 border-b border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
          <Flame className="w-6 h-6 text-rose-500" />
          <span className="font-bold text-lg tracking-tight uppercase">Roast My UI</span>
        </div>
        <a
          href="https://ai.google.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-neutral-500 hover:text-white transition-colors flex items-center gap-1"
        >
          POWERED BY GEMINI <ExternalLink className="w-3 h-3" />
        </a>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 z-10 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <LoadingState />
        ) : roastData ? (
          <RoastResult data={roastData} onReset={handleReset} />
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center text-center space-y-12 animate-in fade-in zoom-in duration-500">
            <div className="space-y-6">
              <div className="inline-block border border-rose-500/30 bg-rose-500/10 px-3 py-1 rounded-full">
                <span className="text-rose-400 text-xs font-mono uppercase tracking-widest">
                  AI-Powered Design Critique
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.9]">
                YOUR UI IS <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-600">
                  PROBABLY MID.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-400 max-w-lg mx-auto font-light">
                Paste your URL. Gemini will analyze your spacing, color theory, and life choices.
                <span className="block mt-2 text-rose-500 font-mono text-sm opacity-80">
                    // ZERO MERCY. NO CAP.
                </span>
              </p>
            </div>

            <div className="w-full">
              <RoastForm onSubmit={handleRoastRequest} />
              {error && (
                <div className="mt-4 p-4 border border-red-500/50 bg-red-900/10 text-red-200 font-mono text-sm">
                  ERROR: {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-8 opacity-40 pt-12 w-full max-w-lg">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">01</div>
                <div className="text-xs font-mono text-neutral-500 uppercase">Input URL</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">02</div>
                <div className="text-xs font-mono text-neutral-500 uppercase">AI Analyze</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">03</div>
                <div className="text-xs font-mono text-neutral-500 uppercase">Get Cooked</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full p-6 text-center z-10 border-t border-white/5">
        <p className="text-neutral-600 text-xs font-mono">
          &copy; {new Date().getFullYear()} ROAST MY UI LABS. DO NOT TAKE THIS PERSONALLY.
        </p>
      </footer>
    </div>
  );
};

export default App;