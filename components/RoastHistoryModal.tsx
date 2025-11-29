"use client";

import React, { useEffect, useState } from 'react';
import { X, Clock, ArrowRight } from 'lucide-react';
import { getUserRoastHistory, type RoastData } from '@/app/actions';

interface RoastHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectRoast: (roast: RoastData) => void;
}

// Helper to format date without extra libs if possible, but date-fns is standard. 
// I'll check if date-fns is installed. If not, I'll use native.
// Checking package.json... I don't see date-fns. I'll use native Intl.RelativeTimeFormat or just simple date string.

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    }).format(new Date(date));
};

export const RoastHistoryModal: React.FC<RoastHistoryModalProps> = ({ isOpen, onClose, onSelectRoast }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchHistory = async () => {
                setLoading(true);
                try {
                    const data = await getUserRoastHistory();
                    setHistory(data);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchHistory();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 m-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-4 sm:p-6 border-b border-white/5 flex justify-between items-center bg-neutral-900/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-rose-500" />
                        Roast History
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-4 sm:p-6 space-y-3">
                    {loading ? (
                        <div className="text-center py-12 text-neutral-500 animate-pulse">
                            Loading your shame...
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-neutral-500">
                            <p>No roasts found.</p>
                            <p className="text-sm mt-2">Go roast something!</p>
                        </div>
                    ) : (
                        history.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    // Map DB item to RoastData
                                    const roastData: RoastData = {
                                        url: item.url,
                                        score: parseFloat(item.score),
                                        tagline: item.tagline,
                                        roast: item.roast,
                                        shareText: item.shareText || "",
                                        strengths: item.strengths as string[],
                                        weaknesses: item.weaknesses as string[],
                                        visualCrimes: item.visualCrimes as string[],
                                        bestPart: item.bestPart || "",
                                        worstPart: item.worstPart || "",
                                        sources: [], // We don't store sources yet
                                        screenshot: item.screenshot || undefined,
                                        analysisType: (item.analysisType as 'hero' | 'full-page') || 'hero',
                                        remainingCredits: 0, // Not relevant for history
                                    };
                                    onSelectRoast(roastData);
                                    onClose();
                                }}
                                className="group flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-xl hover:border-rose-500/50 hover:bg-white/10 transition-all cursor-pointer active:scale-[0.99]"
                            >
                                {/* Thumbnail */}
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-950 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 relative">
                                    {item.screenshot ? (
                                        <img
                                            src={item.screenshot}
                                            alt="Thumbnail"
                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-700 font-mono">
                                            NO IMG
                                        </div>
                                    )}
                                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${parseFloat(item.score) < 5 ? 'bg-red-500' : 'bg-green-500'}`} />
                                </div>

                                {/* Content */}
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-white truncate pr-2 text-sm sm:text-base">
                                            {item.url}
                                        </h3>
                                        <span className={`font-mono font-bold text-xs sm:text-sm ${parseFloat(item.score) < 5 ? 'text-red-400' : 'text-green-400'}`}>
                                            {item.score}/10
                                        </span>
                                    </div>
                                    <p className="text-neutral-400 text-xs truncate mb-2 font-mono">
                                        {item.tagline}
                                    </p>
                                    <div className="flex items-center gap-3 text-[10px] text-neutral-500">
                                        <span>{formatDate(item.createdAt)}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 uppercase">
                                            {item.analysisType}
                                        </span>
                                    </div>
                                </div>

                                <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-rose-500 transition-transform group-hover:translate-x-1" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
