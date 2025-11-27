import React from 'react';
import { Check, X } from 'lucide-react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    creditsAdded: number;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, onClose, creditsAdded }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-md bg-neutral-900 border border-green-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-green-500/20 blur-[80px] pointer-events-none" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-8 flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center mb-2">
                        <Check className="w-10 h-10 text-green-400" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-white tracking-tight">
                            Payment Successful!
                        </h2>
                        <p className="text-neutral-400 text-lg">
                            You&apos;re ready to roast.
                        </p>
                    </div>

                    <div className="w-full bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                        <p className="text-neutral-300 font-mono text-sm uppercase tracking-wider mb-1">
                            Credits Added
                        </p>
                        <p className="text-4xl font-bold text-green-400">
                            +{creditsAdded}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/20"
                    >
                        Start Roasting
                    </button>
                </div>
            </div>
        </div>
    );
};
