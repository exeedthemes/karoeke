import React, { useState, useEffect } from 'react';
import { 
  Mic, 
  Search, 
  Users, 
  Music, 
  Sparkles, 
  Check, 
  Heart, 
  Sliders, 
  Tv, 
  Video, 
  CheckCircle2, 
  ThumbsUp, 
  Flame, 
  UserPlus,
  ArrowUpCircle,
  Trophy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  POPULAR_KARAOKE_SONGS, 
  KARAOKE_CATEGORIES, 
  extractYouTubeId 
} from '../services/catalog';
import { 
  requestSong, 
  joinDuet, 
  upvoteSong 
} from '../services/firebase';
import { playSound } from '../services/soundEffects';

const PITCH_OPTIONS = [
  { value: -4, label: '-4 st (Super Low)' },
  { value: -2, label: '-2 st (Lower Key)' },
  { value: -1, label: '-1 st (Slightly Low)' },
  { value: 0, label: '0 (Original Key)' },
  { value: 1, label: '+1 st (Slightly High)' },
  { value: 2, label: '+2 st (Higher Key)' },
  { value: 4, label: '+4 st (Super High)' },
];

export default function GuestView({ roomData, roomId, onSwitchToHost }) {
  const [activeTab, setActiveTab] = useState('request'); // 'request' | 'queue'
  const [queueFilter, setQueueFilter] = useState('open'); // 'open' | 'all'
  const [singerName, setSingerName] = useState(() => {
    return localStorage.getItem('singwave_singer_name') || '';
  });
  const [mode, setMode] = useState('open'); // default to open so crowd can vote!
  const [pitchShift, setPitchShift] = useState(0);
  const [note, setNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [submittedSong, setSubmittedSong] = useState(null);
  const [votedSongs, setVotedSongs] = useState({});

  const queue = roomData?.queue || [];
  const currentSong = roomData?.currentSong;

  // Filter open songs
  const openSongs = queue.filter(s => s.mode === 'open');

  // Persist singer name locally
  useEffect(() => {
    if (singerName.trim()) {
      localStorage.setItem('singwave_singer_name', singerName.trim());
    }
  }, [singerName]);

  const filteredCatalog = POPULAR_KARAOKE_SONGS.filter((s) => {
    const matchesCategory =
      selectedCategory === 'All' || s.genre === selectedCategory;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRequest = async (song) => {
    if (!singerName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    const payload = {
      title: song.title,
      artist: song.artist,
      youtubeId: song.youtubeId,
      singer: singerName.trim(),
      mode: mode,
      pitchShift: pitchShift,
      note: note.trim()
    };

    const newSong = await requestSong(roomId, payload);
    playSound('fanfare');
    setSubmittedSong(newSong);
    setNote('');
    setActiveTab('queue');

    setTimeout(() => {
      setSubmittedSong(null);
    }, 4000);
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!singerName.trim()) {
      alert('Please enter your name first!');
      return;
    }

    const ytid = extractYouTubeId(customYoutubeUrl);
    if (!ytid) {
      alert('Please enter a valid YouTube or YouTube Music link!');
      return;
    }

    const payload = {
      title: customYoutubeUrl.includes('http') ? 'Custom YouTube Track' : customYoutubeUrl,
      artist: 'Guest Choice',
      youtubeId: ytid,
      singer: singerName.trim(),
      mode: mode,
      pitchShift: pitchShift,
      note: note.trim()
    };

    const newSong = await requestSong(roomId, payload);
    playSound('fanfare');
    setSubmittedSong(newSong);
    setCustomYoutubeUrl('');
    setNote('');
    setActiveTab('queue');

    setTimeout(() => {
      setSubmittedSong(null);
    }, 4000);
  };

  const handleVoteToTop = async (songId) => {
    await upvoteSong(roomId, songId);
    setVotedSongs((prev) => ({ ...prev, [songId]: (prev[songId] || 0) + 1 }));
    playSound('applause');
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (e) {}
  };

  const handleJoinDuet = async (songId) => {
    if (!singerName.trim()) {
      alert('Please enter your name first to join the duet!');
      return;
    }
    await joinDuet(roomId, songId, singerName.trim());
    playSound('cheer');
  };

  // Find user's spot in queue
  const userQueueIndex = queue.findIndex(
    (s) => s.singer?.toLowerCase() === singerName.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-12 selection:bg-pink-500">
      
      {/* Mobile Header (Clean - Zero PINs) */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-lg border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-md shadow-pink-500/30">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-tight font-display">SingWave</span>
              <p className="text-[10px] text-slate-400">Song Request & Live Voting</p>
            </div>
          </div>

          <button
            onClick={onSwitchToHost}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700/60"
          >
            <Tv className="w-3.5 h-3.5 text-pink-400" /> Host Screen
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 max-w-md mx-auto w-full mt-3">
          <button
            onClick={() => setActiveTab('request')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'request'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" /> Request a Song
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
              activeTab === 'queue'
                ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Live Queue & Votes
            {queue.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-950 font-mono text-pink-400">
                {queue.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-md mx-auto w-full p-4 space-y-4">
        
        {/* Success Alert Banner */}
        {submittedSong && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top duration-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Song Added to Queue!</p>
              <p className="text-[11px] text-emerald-300">
                "{submittedSong.title}" is queued up! Get your vocal cords ready!
              </p>
            </div>
          </div>
        )}

        {/* Singer Status / Spot in Queue Banner */}
        {singerName.trim() && userQueueIndex !== -1 && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/40 text-xs flex items-center justify-between glow-pink">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-xs">
                #{userQueueIndex + 1}
              </div>
              <div>
                <p className="font-bold text-white">
                  {userQueueIndex === 0 ? "You're up NEXT on stage!" : `You are #${userQueueIndex + 1} in queue`}
                </p>
                <p className="text-[11px] text-pink-300">
                  Approx {Math.max(1, userQueueIndex * 4)} mins until your turn
                </p>
              </div>
            </div>
            <Sparkles className="w-5 h-5 text-pink-400 animate-spin" />
          </div>
        )}

        {/* TAB 1: REQUEST A SONG */}
        {activeTab === 'request' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Requester Identity Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  1. Who is singing? (Your Name / Stage Alias)
                </label>
                <div className="relative">
                  <Mic className="absolute left-3 top-3 w-4 h-4 text-pink-400" />
                  <input
                    type="text"
                    value={singerName}
                    onChange={(e) => setSingerName(e.target.value)}
                    placeholder="e.g. Freddie, Sarah, Rocket Man"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition"
                  />
                </div>
              </div>

              {/* Mode Selection: Solo vs. Open Mic / Duet */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  2. Performance Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('open')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      mode === 'open'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Users className="w-3.5 h-3.5 text-cyan-400" /> Open Mic / Duet 🔥
                    </div>
                    <span className="text-[10px] text-cyan-300/80">
                      People can vote & bump to top!
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('solo')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      mode === 'solo'
                        ? 'bg-purple-950/60 border-purple-500 text-purple-200 ring-1 ring-purple-500/50'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                      <Mic className="w-3.5 h-3.5 text-purple-400" /> Solo Performance
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Spotlight is just for you!
                    </span>
                  </button>
                </div>
              </div>

              {/* Key / Pitch Shifter Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-pink-400" /> 3. Pitch / Key Preference
                  </label>
                  <span className="text-[11px] font-semibold text-pink-400">
                    {pitchShift === 0 ? 'Original Key' : `${pitchShift > 0 ? `+${pitchShift}` : pitchShift} Semitones`}
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                  {PITCH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPitchShift(opt.value)}
                      className={`py-1.5 rounded-lg text-xs font-bold transition text-center ${
                        pitchShift === opt.value
                          ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {opt.value > 0 ? `+${opt.value}` : opt.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Dedication */}
              <div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Dedication / Note (e.g. 'Sing along on chorus!')"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Custom YouTube URL Paste Option */}
            <form onSubmit={handleCustomSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Video className="w-4 h-4 text-rose-400" /> Have a specific YouTube or YouTube Music song?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customYoutubeUrl}
                  onChange={(e) => setCustomYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube or YouTube Music link..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  disabled={!customYoutubeUrl.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Request
                </button>
              </div>
            </form>

            {/* Catalog Browser */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white font-display">
                Browse Popular Karaoke Classics
              </h3>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search artist or title..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {KARAOKE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-pink-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Songs List */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {filteredCatalog.map((song) => (
                  <div
                    key={song.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-pink-500/40 transition group"
                  >
                    <div className="overflow-hidden pr-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {song.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {song.artist} • <span className="text-slate-500">{song.duration}</span>
                      </p>
                    </div>

                    <button
                      onClick={() => handleRequest(song)}
                      className="px-3.5 py-1.5 rounded-xl bg-pink-500 hover:bg-pink-600 active:scale-95 text-white font-bold text-xs shadow-md shadow-pink-500/20 shrink-0 transition"
                    >
                      Request
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LIVE QUEUE & OPEN VOTING */}
        {activeTab === 'queue' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Now Singing Stage Card */}
            {currentSong ? (
              <div className="bg-gradient-to-r from-pink-950/40 to-slate-900 border border-pink-500/40 rounded-3xl p-4 shadow-xl glow-pink">
                <div className="flex items-center gap-1.5 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5" /> On Stage Now
                </div>
                <h3 className="text-base font-bold text-white">
                  {currentSong.title}
                </h3>
                <p className="text-xs text-slate-300">
                  {currentSong.artist}
                </p>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-xs font-bold text-pink-300 bg-pink-900/40 px-2.5 py-1 rounded-lg border border-pink-700/40">
                    🎤 {currentSong.singer}
                  </span>

                  {currentSong.mode === 'open' ? (
                    <span className="text-xs font-semibold text-cyan-300 bg-cyan-900/40 px-2 py-1 rounded-lg border border-cyan-700/40">
                      👥 Open Mic
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-purple-300 bg-purple-900/40 px-2 py-1 rounded-lg border border-purple-700/40">
                      Solo
                    </span>
                  )}

                  {currentSong.duetPartners?.length > 0 && (
                    <span className="text-xs text-slate-300">
                      with {currentSong.duetPartners.join(', ')}
                    </span>
                  )}
                </div>

                {currentSong.mode === 'open' &&
                  currentSong.singer?.toLowerCase() !== singerName.toLowerCase() &&
                  !currentSong.duetPartners?.includes(singerName) && (
                    <button
                      onClick={() => handleJoinDuet(currentSong.id)}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" /> Join as Duet Partner Right Now!
                    </button>
                  )}
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-center text-slate-400 text-xs">
                Stage is open! Request a song to start!
              </div>
            )}

            {/* Filter Toggle: Open Mic Voting vs All Songs */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setQueueFilter('open')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  queueFilter === 'open'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-3.5 h-3.5" /> Open Mic Voting ({openSongs.length})
              </button>
              <button
                onClick={() => setQueueFilter('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  queueFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Songs ({queue.length})
              </button>
            </div>

            {/* Voting Explanation Banner */}
            {queueFilter === 'open' && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-800/50 rounded-2xl text-[11px] text-cyan-200 flex items-center gap-2">
                <ArrowUpCircle className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>
                  Tap <strong>"Vote to Top! 🔥"</strong> on any open song to bump it to the #1 spot in the queue!
                </span>
              </div>
            )}

            {/* Queue List */}
            <div className="space-y-2.5">
              {(queueFilter === 'open' ? openSongs : queue).length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-xs">
                  {queueFilter === 'open'
                    ? 'No open mic songs requested yet! Switch to Request and pick "Open Mic"!'
                    : 'No songs in queue yet!'}
                </div>
              ) : (
                (queueFilter === 'open' ? openSongs : queue).map((song, idx) => {
                  const isOpen = song.mode === 'open';
                  const isTopVoted = idx === 0 && (song.votes || 1) > 1;

                  return (
                    <div
                      key={song.id || idx}
                      className={`p-4 rounded-3xl border transition space-y-2 ${
                        isTopVoted
                          ? 'bg-gradient-to-r from-pink-950/50 via-slate-900 to-slate-900 border-pink-500/60 shadow-lg glow-pink'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            #{idx + 1}
                          </span>

                          {isTopVoted && (
                            <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800 flex items-center gap-1">
                              <Trophy className="w-3 h-3 text-amber-400" /> #1 Crowd Choice
                            </span>
                          )}
                        </div>

                        {/* Big Vote Button (Bumps to top!) */}
                        <button
                          onClick={() => handleVoteToTop(song.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 active:scale-95 text-white font-black text-xs shadow-md shadow-pink-500/25 transition hover:scale-105"
                          title="Vote this song up to the top!"
                        >
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          <span>Vote to Top ({song.votes || 1})</span>
                        </button>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {song.title}
                        </h4>
                        <p className="text-xs text-slate-400">
                          {song.artist}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] font-bold text-pink-300 bg-pink-950/60 px-2 py-0.5 rounded border border-pink-900/50">
                          🎤 {song.singer}
                        </span>

                        {isOpen ? (
                          <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-900/50">
                            👥 Open Mic / Duet
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-900/50">
                            Solo
                          </span>
                        )}

                        {song.pitchShift !== 0 && (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/50">
                            Key: {song.pitchShift > 0 ? `+${song.pitchShift}` : song.pitchShift} st
                          </span>
                        )}

                        {isOpen && !song.duetPartners?.includes(singerName) && song.singer?.toLowerCase() !== singerName.toLowerCase() && (
                          <button
                            onClick={() => handleJoinDuet(song.id)}
                            className="text-[10px] font-bold text-cyan-300 hover:text-white bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800 flex items-center gap-1 ml-auto"
                          >
                            <UserPlus className="w-3 h-3" /> Join Duet
                          </button>
                        )}
                      </div>

                      {song.duetPartners?.length > 0 && (
                        <p className="text-[10px] text-cyan-300">
                          👥 Co-singers: {song.duetPartners.join(', ')}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
