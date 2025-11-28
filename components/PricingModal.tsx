"use client";

import React, { useState } from 'react';
import { X, Check, Zap, Crown } from 'lucide-react';
import { createCheckout } from '@/app/actions';

interface PricingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState<'15_CREDITS' | '40_CREDITS' | null>(null);

    if (!isOpen) return null;

    const handlePurchase = async (plan: '15_CREDITS' | '40_CREDITS') => {
        setLoading(plan);
        try {
            const url = await createCheckout(plan);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Failed to start checkout. Please try again.");
            setLoading(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto overscroll-contain"
            onClick={onClose}
        >
            <div
                className="relative w-full sm:w-auto sm:min-w-[600px] sm:max-w-3xl bg-neutral-900/98 backdrop-blur-xl border-t sm:border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 ring-1 ring-white/5 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 text-neutral-400 hover:text-white active:text-white transition rounded-full hover:bg-neutral-800 active:bg-neutral-800 active:scale-95 z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-4 sm:p-6 md:p-8 text-center pt-5 sm:pt-8 pb-3 sm:pb-6">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1.5 sm:mb-2 pr-8" style={{
                        textShadow: '0 2px 10px rgba(255,255,255,0.2)'
                    }}>
                        Refill Credits
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-neutral-400">
                        Choose a package to continue roasting
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-4 md:px-8 pb-3 sm:pb-4 md:pb-8">
                    {/* Starter Pack */}
                    <div className="relative group p-4 sm:p-5 md:p-6 bg-white/5 border border-white/10 rounded-lg sm:rounded-xl hover:border-rose-500/50 transition-all duration-300">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-800 text-neutral-300 text-[9px] sm:text-[10px] md:text-xs font-bold px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full border border-neutral-700">
                            STARTER
                        </div>
                        <div className="text-center mb-3 sm:mb-4 md:mb-5 mt-1 sm:mt-2">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">$5</div>
                            <div className="text-rose-500 font-mono text-xs sm:text-sm">15 CREDITS</div>
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2 md:space-y-2.5 mb-4 sm:mb-5 md:mb-6 text-[11px] sm:text-xs md:text-sm text-neutral-400">
                            <li className="flex items-center gap-1.5 sm:gap-2">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0" />
                                <span>$0.33 per roast</span>
                            </li>
                            <li className="flex items-center gap-1.5 sm:gap-2">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0" />
                                <span>Never expires</span>
                            </li>
                            <li className="flex items-center gap-1.5 sm:gap-2">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0" />
                                <span>Full roast history</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => handlePurchase('15_CREDITS')}
                            disabled={loading !== null}
                            className="w-full py-3 sm:py-3.5 md:py-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group-hover:bg-rose-500/10 group-hover:text-rose-500 group-hover:border-rose-500/50 border border-transparent active:scale-95 text-xs sm:text-sm md:text-base"
                        >
                            {loading === '15_CREDITS' ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Get 15 Credits
                                </>
                            )}
                        </button>
                    </div>

                    {/* Pro Pack */}
                    <div className="relative group p-4 sm:p-5 md:p-6 bg-white/5 border border-rose-500/30 rounded-lg sm:rounded-xl hover:border-rose-500 transition-all duration-300 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white text-[9px] sm:text-[10px] md:text-xs font-bold px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 rounded-full shadow-lg">
                            BEST VALUE
                        </div>
                        <div className="text-center mb-3 sm:mb-4 md:mb-5 mt-1 sm:mt-2">
                            <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">$10</div>
                            <div className="text-rose-500 font-mono text-xs sm:text-sm">40 CREDITS</div>
                        </div>
                        <ul className="space-y-1.5 sm:space-y-2 md:space-y-2.5 mb-4 sm:mb-5 md:mb-6 text-[11px] sm:text-xs md:text-sm text-neutral-400">
                            <li className="flex items-center gap-1.5 sm:gap-2">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0" />
                                <span>$0.25 per roast (Save 25%)</span>
                            </li>
                            <li className="flex items-center gap-1.5 sm:gap-2">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0" />
                                <span>Never expires</span>
                            </li>
                            <li className="flex items-center gap-1.5 sm:gap-2">
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 flex-shrink-0" />
                                <span>Priority support (jk)</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => handlePurchase('40_CREDITS')}
                            disabled={loading !== null}
                            className="w-full py-3 sm:py-3.5 md:py-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 active:scale-95 text-xs sm:text-sm md:text-base"
                        >
                            {loading === '40_CREDITS' ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    Get 40 Credits
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-2.5 sm:p-3 md:p-4 bg-neutral-950/50 border-t border-neutral-800 text-center text-[9px] sm:text-[10px] md:text-xs text-neutral-500 leading-relaxed">
                    Secure payments powered by Polar.sh
                </div>
            </div>
        </div>
    );
};
