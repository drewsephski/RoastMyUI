"use client";

import React, { useState } from 'react';
import { ArrowRight, Globe } from 'lucide-react';

interface RoastFormProps {
    onSubmit: (url: string) => void;
}

export const RoastForm: React.FC<RoastFormProps> = ({ onSubmit }) => {
    const [url, setUrl] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onSubmit(url);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-rose-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
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
                    className="bg-white text-black hover:bg-rose-500 hover:text-white transition-all duration-300 font-bold py-3 px-6 rounded-md flex items-center justify-center gap-2 uppercase tracking-wide text-xs sm:text-sm w-full sm:w-auto"
                >
                    Roast It <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </form>
    );
};