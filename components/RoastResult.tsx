/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Share2, RefreshCcw, Copy, Check, Eye } from 'lucide-react';

interface RoastData {
    url: string;
    score: number;
    tagline: string;
    roast: string;
    shareText: string;
    strengths: string[];
    weaknesses: string[];
    visualCrimes: string[];
    bestPart: string;
    worstPart: string;
    sources: { title: string; uri: string }[];
    screenshot?: string;
    analysisType: 'hero' | 'full-page';
}

interface RoastResultProps {
    data: RoastData;
    onReset: () => void;
}

export const RoastResult: React.FC<RoastResultProps> = ({ data, onReset }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(`${data.tagline}\n\n${data.roast}\n\nScore: ${data.score}/10`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        const text = encodeURIComponent(`Just got my UI roasted by AI. Score: ${data.score}/10.\n\n"${data.tagline}"\n\n#RoastMyUI`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    };

    const getScoreColor = (score: number) => {
        if (score < 4) return "text-red-500";
        if (score < 7) return "text-yellow-500";
        return "text-green-500";
    };

    return (
        <div className="w-full max-w-5xl mx-auto perspective-1000 animate-in slide-in-from-bottom-10 fade-in duration-700">

            {/* Roast Card Container */}
            <div className="bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row ring-1 ring-white/5">

                {/* Left Col: Visuals & Score */}
                <div className="w-full md:w-[40%] bg-black/20 border-b md:border-b-0 md:border-r border-white/5 flex flex-col relative">
                    {/* Mac Header */}
                    <div className="bg-white/5 p-3 sm:p-4 border-b border-white/5 flex items-center gap-2 z-10 backdrop-blur-sm">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        <div className="ml-2 font-mono text-[9px] sm:text-[10px] text-neutral-500 truncate">{data.url}</div>
                    </div>

                    {/* Screenshot Preview */}
                    <div className="relative w-full aspect-video bg-neutral-900 overflow-hidden border-b border-neutral-800 group">
                        {data.screenshot ? (
                            <>
                                <img
                                    src={data.screenshot}
                                    alt="Website Screenshot"
                                    className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition duration-500 grayscale group-hover:grayscale-0"
                                />
                                <div className="absolute top-2 right-2 flex gap-1.5 sm:gap-2">
                                    <div className="bg-black/80 text-white text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded font-mono flex items-center gap-1 border border-white/10">
                                        <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> VISUAL SCAN
                                    </div>
                                    <div className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-1 rounded font-mono font-bold border ${data.analysisType === 'hero'
                                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                        : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                                        }`}>
                                        {data.analysisType === 'hero' ? 'HERO' : 'FULL PAGE'}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-700 font-mono text-xs">
                                NO SCREENSHOT SIGNAL
                            </div>
                        )}
                        {/* Score Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 sm:p-6 rounded-xl sm:rounded-2xl transform rotate-[-5deg]">
                                <div className={`text-5xl sm:text-6xl font-bold tracking-tighter ${getScoreColor(data.score)} drop-shadow-2xl`}>
                                    {data.score}
                                </div>
                                <div className="text-center text-[10px] sm:text-xs font-mono text-neutral-500 mt-1 uppercase">Total L</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="p-4 sm:p-6 grid grid-cols-2 gap-3 sm:gap-4 flex-grow bg-gradient-to-b from-neutral-900/50 to-neutral-950/50">
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Design Integrity</h4>
                            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-rose-500" style={{ width: `${data.score * 10}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">User Pain</h4>
                            <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${data.score * 10}%` }}></div>
                            </div>
                        </div>
                        <div className="col-span-2 pt-4 border-t border-neutral-800/50">
                            <h4 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Verdict</h4>
                            <p className="font-mono text-xs text-neutral-300 leading-tight">
                                {data.score < 5 ? "ABSOLUTE TRAGEDY" : "MID AT BEST"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Col: Roast Content */}
                <div className="w-full md:w-[60%] p-4 sm:p-6 md:p-10 flex flex-col bg-transparent">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase leading-none mb-3 sm:mb-4 md:mb-6 text-white tracking-tight">
                        &quot;{data.tagline}&quot;
                    </h2>

                    <p className="font-mono text-neutral-300 leading-relaxed text-xs sm:text-sm md:text-base border-l-2 border-rose-500 pl-3 sm:pl-4 mb-4 sm:mb-6 md:mb-8">
                        {data.roast}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <div className="p-3 sm:p-4 bg-red-950/20 border border-red-500/20 rounded">
                            <h4 className="text-red-400 text-xs font-bold uppercase mb-2">Major L&apos;s</h4>
                            <ul className="text-[11px] sm:text-xs text-neutral-400 space-y-1">
                                {data.weaknesses.map((w, i) => <li key={i}>- {w}</li>)}
                            </ul>
                        </div>
                        <div className="p-3 sm:p-4 bg-green-950/20 border border-green-500/20 rounded">
                            <h4 className="text-green-400 text-xs font-bold uppercase mb-2">Rare W&apos;s</h4>
                            <ul className="text-[11px] sm:text-xs text-neutral-400 space-y-1">
                                {data.strengths.map((s, i) => <li key={i}>- {s}</li>)}
                            </ul>
                        </div>
                    </div>

                    {/* New Sections: Visual Crimes & Best/Worst */}
                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        {data.visualCrimes && data.visualCrimes.length > 0 && (
                            <div className="p-3 sm:p-4 bg-neutral-950/40 border border-white/5 rounded">
                                <h4 className="text-neutral-500 text-xs font-bold uppercase mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    Visual Crimes Detected
                                </h4>
                                <ul className="text-[11px] sm:text-xs text-neutral-300 space-y-1 font-mono">
                                    {data.visualCrimes.map((crime, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-red-500/50">x</span> {crime}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {data.bestPart && (
                                <div className="p-3 bg-white/5 border border-white/5 rounded">
                                    <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">Surprisingly Good</span>
                                    <p className="text-[11px] sm:text-xs text-neutral-300">{data.bestPart}</p>
                                </div>
                            )}
                            {data.worstPart && (
                                <div className="p-3 bg-red-500/5 border border-red-500/10 rounded">
                                    <span className="text-[10px] text-red-400/70 uppercase font-bold block mb-1">Absolute Worst</span>
                                    <p className="text-[11px] sm:text-xs text-neutral-300">{data.worstPart}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={handleShare}
                                className="flex-1 bg-white text-black hover:bg-neutral-200 transition px-4 py-3.5 sm:py-3 rounded font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Share2 className="w-4 h-4" /> Share
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex-1 bg-transparent border border-neutral-700 text-white hover:bg-neutral-800 transition px-4 py-3.5 sm:py-3 rounded font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 active:scale-95"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>

                        {data.sources && data.sources.length > 0 && (
                            <div className="flex flex-wrap gap-2 items-center pt-3 sm:pt-4 border-t border-neutral-800/50">
                                <span className="text-[10px] text-neutral-600 font-mono uppercase w-full sm:w-auto">Sources:</span>
                                {data.sources.slice(0, 2).map((source, idx) => (
                                    <a key={idx} href={source.uri} target="_blank" rel="noreferrer" className="text-[10px] text-neutral-500 hover:text-rose-500 active:text-rose-400 transition truncate max-w-[150px] block">
                                        {source.title}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center mt-6 sm:mt-8">
                <button
                    onClick={onReset}
                    className="text-neutral-500 hover:text-rose-500 active:text-rose-400 transition flex items-center gap-2 mx-auto font-mono text-sm uppercase tracking-widest hover:underline decoration-rose-500 underline-offset-4 active:scale-95"
                >
                    <RefreshCcw className="w-4 h-4" /> Roast Another
                </button>
            </div>
        </div>
    );
};