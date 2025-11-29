/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from 'react';
import { getHallOfShame } from '@/app/actions';
import { Flame } from 'lucide-react';

export const HallOfShame = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [roasts, setRoasts] = useState<any[]>([]);

    useEffect(() => {
        getHallOfShame().then(setRoasts);
    }, []);

    if (roasts.length === 0) {
        return (
            <section className="w-full py-12 border-t border-white/5 bg-black/20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="flex items-center gap-2 mb-4 justify-center opacity-50">
                        <Flame className="w-6 h-6 text-neutral-600" />
                        <h2 className="text-2xl font-bold text-neutral-600 uppercase tracking-widest">Hall of Shame</h2>
                        <Flame className="w-6 h-6 text-neutral-600" />
                    </div>
                    <p className="text-neutral-500 font-mono text-sm">No victims yet. Be the first to get roasted.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full py-12 border-t border-white/5 bg-black/20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center gap-2 mb-8 justify-center">
                    <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Hall of Shame</h2>
                    <Flame className="w-6 h-6 text-rose-500 animate-pulse" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {roasts.map((roast) => (
                        <div key={roast.id} className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden hover:border-rose-500/30 transition group">
                            <div className="aspect-video bg-black relative">
                                {roast.screenshot ? (
                                    <img src={roast.screenshot} alt="Roast" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-neutral-800">NO IMG</div>
                                )}
                                <div className="absolute top-2 right-2 bg-black/80 text-red-500 font-bold px-2 py-1 rounded text-xs border border-red-500/30">
                                    {roast.score}/10
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-neutral-400 text-xs font-mono mb-2 truncate">{roast.url}</p>
                                <p className="text-white text-sm font-bold leading-tight line-clamp-2">
                                    &quot;{roast.tagline}&quot;
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
