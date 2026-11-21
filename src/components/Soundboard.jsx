import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { playSound } from '../services/soundEffects';

export default function Soundboard() {
  const sounds = [
    { label: 'Applause', icon: '👏', type: 'applause' },
    { label: 'Airhorn', icon: '📢', type: 'airhorn' },
    { label: 'Cheer', icon: '🎉', type: 'cheer' },
    { label: 'Drumroll', icon: '🥁', type: 'drumroll' },
    { label: 'Fanfare', icon: '🎺', type: 'fanfare' },
  ];

  return (
    <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
      <div className="text-xs font-bold text-slate-400 px-2 flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-pink-400" /> SFX:
      </div>
      {sounds.map((s) => (
        <button
          key={s.type}
          onClick={() => playSound(s.type)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition active:scale-95"
          title={`Play ${s.label}`}
        >
          <span>{s.icon}</span>
          <span className="hidden sm:inline">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

