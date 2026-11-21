import React from 'react';
import { Volume2, Sparkles, Disc, Bell, Flame } from 'lucide-react';
import { playSound } from '../services/soundEffects';

export default function Soundboard() {
  const sounds = [
    { label: 'Applause', type: 'applause' },
    { label: 'Airhorn', type: 'airhorn' },
    { label: 'Cheer', type: 'cheer' },
    { label: 'Drumroll', type: 'drumroll' },
    { label: 'Fanfare', type: 'fanfare' },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
      <div className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1.5">
        <Volume2 className="w-3.5 h-3.5 text-pink-400" />
        <span>Audio FX:</span>
      </div>
      {sounds.map((s) => (
        <button
          key={s.type}
          onClick={() => playSound(s.type)}
          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition active:scale-95"
          title={`Play ${s.label}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
