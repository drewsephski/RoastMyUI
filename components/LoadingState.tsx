"use client";

import React, { useEffect, useState } from 'react';

const MESSAGES = [
    "Firing up the screenshot drone...",
    "Stealing your pixels...",
    "Judging your padding-top...",
    "Analyzing color hex codes...",
    "Laughing at your typography...",
    "Reading the CSS spaghetti...",
    "Checking for accessibility issues...",
    "Ensuring cross-browser compatibility...",
    "Generating savage insults...",
    "Eliminating render-blocking resources...",
    "Minifying JavaScript and CSS...",
];

export const LoadingState: React.FC = () => {
    const [msgIndex, setMsgIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMsgIndex((prev) => (prev + 1) % MESSAGES.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500 py-12">
            <div className="relative w-32 h-32">
                <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
                <div className="absolute inset-0 border-t-4 border-rose-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 overflow-hidden relative">
                        <div className="absolute inset-0 bg-rose-500/10 animate-pulse"></div>
                        <span className="text-3xl relative z-10 animate-bounce">📸</span>
                    </div>
                </div>
            </div>

            <div className="text-center space-y-2 max-w-sm">
                <h2 className="text-xl font-bold font-mono text-white tracking-tight uppercase">
                    {MESSAGES[msgIndex]}
                </h2>
                <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-rose-500 animate-[loading_2s_ease-in-out_infinite]"></div>
                </div>
                <p className="text-neutral-600 text-xs font-mono pt-2">
                    AI VISION IS ACTIVE
                </p>
            </div>

            <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
};