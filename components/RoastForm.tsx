"use client";

import React, { useState } from 'react';
import { ArrowRight, Globe, Zap, Layers } from 'lucide-react';

interface RoastFormProps {
    onSubmit: (url: string, analysisType: 'hero' | 'full-page') => void;
}

export const RoastForm: React.FC<RoastFormProps> = ({ onSubmit }) => {
    const [url, setUrl] = useState('');
    const [analysisType, setAnalysisType] = useState<'hero' | 'full-page'>('hero');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url, analysisType);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Analysis Type Selector */}
            <div className="flex items-center justify-center gap-3 p-1.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                <button
                    type="button"
                    onClick={() => setAnalysisType('hero')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-300 ${analysisType === 'hero'
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Zap className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm">Hero Only</span>
                        <span className="text-xs opacity-75">1 Credit</span>
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => setAnalysisType('full-page')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-300 ${analysisType === 'full-page'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                >
                    <Layers className="w-4 h-4" />
                    <div className="flex flex-col items-start">
                        <span className="font-bold text-sm">Full Page</span>
                        <span className="text-xs opacity-75">3 Credits</span>
                    </div>
                </button>
            </div>

            {/* URL Input Form */}
            <form onSubmit={handleSubmit} className="w-full relative group">
                <div className={`absolute -inset-1 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 ${analysisType === 'hero'
                        ? 'bg-gradient-to-r from-rose-600 to-pink-600'
                        : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                    }`}></div>
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-white/5 backdrop-blur-sm border border-white/10 p-2 rounded-lg shadow-2xl gap-2 sm:gap-0">
                    <div className="pl-4 text-neutral-500 hidden sm:block">
                        <Globe className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://your-mid-website.com"
                        className="flex-grow bg-transparent border-none text-white px-4 py-3 sm:py-4 focus:outline-none focus:ring-0 font-mono text-sm sm:text-base placeholder-neutral-600 text-center sm:text-left"
                        required
                    />
                    <button
                        type="submit"
                        className={`font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2 uppercase tracking-wide text-xs sm:text-sm w-full sm:w-auto group transition-all duration-300 ${analysisType === 'hero'
                                ? 'bg-white text-black hover:bg-rose-500 hover:text-white'
                                : 'bg-white text-black hover:bg-purple-600 hover:text-white'
                            }`}
                    >
                        Roast It <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                </div>
            </form>

            {/* Info Text */}
            <p className="text-center text-neutral-500 text-xs">
                {analysisType === 'hero' ? (
                    <>
                        <Zap className="w-3 h-3 inline mr-1" />
                        Quick analysis of your hero section
                    </>
                ) : (
                    <>
                        <Layers className="w-3 h-3 inline mr-1" />
                        Deep dive into your entire landing page
                    </>
                )}
            </p>
        </div>
    );
};