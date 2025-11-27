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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-800"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 text-center">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent mb-2">
                        Refill Your Roasting Credits
                    </h2>
                    <p className="text-neutral-400">
                        Choose a package to continue getting your UI destroyed.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 p-8 pt-0">
                    {/* Starter Pack */}
                    <div className="relative group p-6 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-rose-500/50 transition-all duration-300">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-800 text-neutral-300 text-xs font-bold px-3 py-1 rounded-full border border-neutral-700">
                            STARTER
                        </div>
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-white mb-1">$5</div>
                            <div className="text-rose-500 font-mono text-sm">15 CREDITS</div>
                        </div>
                        <ul className="space-y-3 mb-8 text-sm text-neutral-400">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-rose-500" />
                                <span>$0.33 per roast</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-rose-500" />
                                <span>Never expires</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-rose-500" />
                                <span>Full roast history</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => handlePurchase('15_CREDITS')}
                            disabled={loading !== null}
                            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 group-hover:bg-rose-500/10 group-hover:text-rose-500 group-hover:border-rose-500/50 border border-transparent"
                        >
                            {loading === '15_CREDITS' ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    Get 15 Credits
                                </>
                            )}
                        </button>
                    </div>

                    {/* Pro Pack */}
                    <div className="relative group p-6 bg-neutral-950 border border-rose-500/30 rounded-xl hover:border-rose-500 transition-all duration-300 shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                            BEST VALUE
                        </div>
                        <div className="text-center mb-6">
                            <div className="text-4xl font-bold text-white mb-1">$10</div>
                            <div className="text-rose-500 font-mono text-sm">40 CREDITS</div>
                        </div>
                        <ul className="space-y-3 mb-8 text-sm text-neutral-400">
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-rose-500" />
                                <span>$0.25 per roast (Save 25%)</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-rose-500" />
                                <span>Never expires</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-rose-500" />
                                <span>Priority support (jk)</span>
                            </li>
                        </ul>
                        <button
                            onClick={() => handlePurchase('40_CREDITS')}
                            disabled={loading !== null}
                            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
                        >
                            {loading === '40_CREDITS' ? (
                                <span className="animate-pulse">Processing...</span>
                            ) : (
                                <>
                                    <Crown className="w-4 h-4" />
                                    Get 40 Credits
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="p-4 bg-neutral-950/50 border-t border-neutral-800 text-center text-xs text-neutral-500">
                    Secure payments powered by Polar.sh. No refunds because we spent it already.
                </div>
            </div>
        </div>
    );
};
