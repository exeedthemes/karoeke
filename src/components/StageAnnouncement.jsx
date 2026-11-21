import React, { useEffect, useState } from 'react';
import { Mic, Users, Music2, Sparkles, Play, Clock, UserCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../services/soundEffects';

export default function StageAnnouncement({ song, onStart, onWait, onDismiss }) {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    playSound('fanfare');
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playSound('applause');
          onStart();
          return 0;
        }
        if (prev <= 4) {
          playSound('beep');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!song) return null;

  const isOpenMode = song.mode === 'open';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 sm:p-8 animate-in fade-in duration-300">
      {/* Dynamic Stage Light Flares */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      <div className="relative max-w-2xl w-full bg-slate-900/90 border-2 border-pink-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl glow-pink text-center overflow-hidden">
        
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-pink-400 font-semibold text-xs tracking-wider uppercase mb-6 animate-bounce">
          <Sparkles className="w-3.5 h-3.5" /> Next Performance
        </div>

        {/* Singer Name */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white capitalize text-glow-pink font-display">
              {song.singer || "Featured Singer"}
            </h1>
          </div>

          {/* Mode Pill: Open / Solo */}
          <div className="flex items-center justify-center gap-2 mt-3">
            {isOpenMode ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold">
                <Users className="w-3.5 h-3.5" /> Open Session (Guest Participation)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-semibold">
                <Mic className="w-3.5 h-3.5" /> Solo Performance
              </span>
            )}

            {song.pitchShift !== 0 && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold">
                Pitch: {song.pitchShift > 0 ? `+${song.pitchShift}` : song.pitchShift} st
              </span>
            )}
          </div>

          {/* Duet Partners if any */}
          {isOpenMode && song.duetPartners && song.duetPartners.length > 0 && (
            <div className="mt-3 text-xs text-cyan-200 bg-cyan-950/40 py-1.5 px-3 rounded-lg border border-cyan-800/40 inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Accompanying: <strong className="text-white">{song.duetPartners.join(', ')}</strong></span>
            </div>
          )}
        </div>

        {/* Song Card */}
        <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 mb-8 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            <Music2 className="w-3.5 h-3.5 text-pink-400" /> Selected Track
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            {song.title}
          </h2>
          <p className="text-base text-slate-300 font-medium">
            {song.artist}
          </p>

          {song.note && (
            <p className="mt-3 text-xs text-pink-300/90 italic bg-pink-950/30 px-3 py-1.5 rounded-lg border border-pink-900/40">
              "{song.note}"
            </p>
          )}
        </div>

        {/* Countdown Ring */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-20 h-20 flex items-center justify-center rounded-full bg-slate-950 border-4 border-pink-500/80 text-3xl font-black text-white glow-pink">
            {countdown > 0 ? countdown : "START"}
          </div>
          <span className="text-xs text-slate-400 mt-2 font-medium">
            {countdown > 0 ? "Vocal preparation in progress..." : "Beginning playback now"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => {
              playSound('applause');
              onStart();
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-pink-500/25 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" /> Start Performance
          </button>

          <button
            onClick={() => {
              if (onWait) onWait(30);
              setCountdown((c) => c + 30);
            }}
            className="flex items-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-xl border border-slate-600 transition"
          >
            <Clock className="w-4 h-4" /> Delay 30 Seconds
          </button>

          <button
            onClick={onDismiss}
            className="px-4 py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-sm font-medium rounded-xl transition"
          >
            Skip Countdown
          </button>
        </div>

      </div>
    </div>
  );
}
