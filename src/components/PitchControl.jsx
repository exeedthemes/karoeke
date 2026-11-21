import React from 'react';
import { Sliders, RotateCcw, Volume2, Gauge } from 'lucide-react';

const SEMITONES = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
const PLAYBACK_RATES = [0.8, 0.9, 1.0, 1.1, 1.2];

export default function PitchControl({
  activePitch = 0,
  playbackRate = 1.0,
  onChangePitch,
  onChangePlaybackRate
}) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-pink-400 font-bold text-sm">
          <Sliders className="w-4 h-4" />
          <span>Karaoke Key & Pitch Shifter</span>
        </div>
        {activePitch !== 0 && (
          <button
            onClick={() => onChangePitch(0)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-pink-400 transition"
            title="Reset pitch to original key"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Semitone Key Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Lower Key (- Semitones)</span>
          <span className="font-semibold text-white">
            {activePitch === 0
              ? 'Original Key (0)'
              : activePitch > 0
              ? `+${activePitch} Semitones (Higher)`
              : `${activePitch} Semitones (Lower)`}
          </span>
          <span>Higher Key (+)</span>
        </div>

        <div className="grid grid-cols-9 gap-1">
          {SEMITONES.map((st) => {
            const isSelected = activePitch === st;
            const isZero = st === 0;

            return (
              <button
                key={st}
                onClick={() => onChangePitch(st)}
                className={`py-1.5 px-0.5 rounded-lg text-xs font-bold transition-all text-center ${
                  isSelected
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/30 scale-105'
                    : isZero
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {st > 0 ? `+${st}` : st}
              </button>
            );
          })}
        </div>
      </div>

      {/* Playback Speed / Tempo */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span>Tempo / Speed:</span>
        </div>
        <div className="flex items-center gap-1">
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              onClick={() => onChangePlaybackRate(rate)}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                playbackRate === rate
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

