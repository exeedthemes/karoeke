import React, { useState } from 'react';
import { Video, ExternalLink, Check, Search, X, Music, Play } from 'lucide-react';
import { extractYouTubeId } from '../services/catalog';

export default function VideoSelectorModal({ isOpen, onClose, song, onApplyVideo }) {
  const [videoInput, setVideoInput] = useState(song?.youtubeId ? `https://www.youtube.com/watch?v=${song.youtubeId}` : '');
  const [previewId, setPreviewId] = useState(song?.youtubeId || '');

  if (!isOpen || !song) return null;

  const searchQuery = `${song.title} ${song.artist} karaoke lyrics instrumental`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;

  const handleInputChange = (val) => {
    setVideoInput(val);
    const parsed = extractYouTubeId(val);
    if (parsed) {
      setPreviewId(parsed);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const parsed = extractYouTubeId(videoInput);
    if (!parsed) {
      alert("Please enter a valid YouTube video link or 11-character video ID!");
      return;
    }
    onApplyVideo(parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center border border-pink-500/30">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-display">Select Karaoke / Lyrics Video</h2>
            <p className="text-xs text-slate-400">
              Replace track with a verified instrumental karaoke video with lyrics.
            </p>
          </div>
        </div>

        {/* Current Song Details */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-4">
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
            Target Song
          </div>
          <div className="text-sm font-bold text-white">{song.title}</div>
          <div className="text-xs text-slate-400">{song.artist} • Requested by {song.singer}</div>
        </div>

        {/* 1-Click YouTube Search Button */}
        <div className="mb-4">
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-2 transition"
          >
            <Search className="w-4 h-4 text-pink-400" />
            <span>Find Karaoke Version on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <p className="text-[10px] text-slate-500 mt-1 text-center">
            Click above to search YouTube, then copy and paste the video link below.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              YouTube / YouTube Music Link or Video ID
            </label>
            <input
              type="text"
              value={videoInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Quick Preview Thumbnail */}
          {previewId && (
            <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
              <img
                src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                alt="Video preview"
                className="w-20 h-12 rounded-lg object-cover bg-slate-800 shrink-0"
              />
              <div className="overflow-hidden">
                <span className="text-[10px] text-emerald-400 font-bold block">Valid Video ID Detected:</span>
                <span className="text-xs text-slate-300 font-mono truncate block">{previewId}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-pink-500/20 transition"
            >
              Apply Karaoke Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
