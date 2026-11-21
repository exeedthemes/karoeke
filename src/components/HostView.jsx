import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Tv, 
  QrCode, 
  Music2, 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw, 
  Maximize, 
  Users, 
  Trash2, 
  Flame, 
  Sparkles, 
  Volume2, 
  Share2, 
  Plus, 
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';
import QRCode from 'qrcode';
import PitchControl from './PitchControl';
import Soundboard from './Soundboard';
import StageAnnouncement from './StageAnnouncement';
import FirebaseModal from './FirebaseModal';
import GoogleSheetModal from './GoogleSheetModal';
import { 
  updateRoomState, 
  playNextSong, 
  removeFromQueue, 
  requestSong, 
  isFirebaseReady,
  sortQueueByVotes
} from '../services/firebase';
import { fetchGoogleSheetRequests } from '../services/googleSheets';
import { POPULAR_KARAOKE_SONGS } from '../services/catalog';
import { playSound } from '../services/soundEffects';

export default function HostView({ roomData, roomId, onSwitchToGuest, user }) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState(() => {
    return localStorage.getItem('singwave_sheet_id') || '';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);

  const [customGuestUrl, setCustomGuestUrl] = useState(() => {
    return localStorage.getItem('singwave_custom_guest_url') || '';
  });
  const [editingGuestUrl, setEditingGuestUrl] = useState(false);
  const [tempGuestUrl, setTempGuestUrl] = useState('');

  const currentSong = roomData?.currentSong;
  const queue = roomData?.queue || [];
  const activePitch = roomData?.activePitch || 0;
  const playbackRate = roomData?.playbackRate || 1.0;
  const isPlaying = roomData?.isPlaying || false;
  const showStageIntro = roomData?.showStageIntro || false;

  // Generate mobile scanner QR code URL:
  // Uses custom public URL (e.g. GitHub Pages or Google Form) if configured, else defaults to current origin
  const guestUrl = customGuestUrl.trim() || `${window.location.origin}${window.location.pathname}?view=guest`;

  useEffect(() => {
    QRCode.toDataURL(guestUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(setQrCodeDataUrl)
      .catch((err) => console.error("QR Code error:", err));
  }, [guestUrl]);

  // Periodic poll from Google Sheet if connected!
  useEffect(() => {
    if (!googleSheetId) return;

    const syncSheet = async () => {
      const sheetRequests = await fetchGoogleSheetRequests(googleSheetId);
      if (sheetRequests.length > 0) {
        const currentQueue = roomData?.queue || [];
        const existingIds = new Set(currentQueue.map(s => s.id));
        const newSongs = sheetRequests.filter(s => !existingIds.has(s.id));

        if (newSongs.length > 0) {
          const merged = sortQueueByVotes([...currentQueue, ...newSongs]);
          updateRoomState(roomId, { queue: merged });
          playSound('fanfare');
        }
      }
    };

    syncSheet();
    const interval = setInterval(syncSheet, 5000);
    return () => clearInterval(interval);
  }, [googleSheetId, roomData?.queue, roomId]);

  const handleSaveSheetId = (id) => {
    setGoogleSheetId(id);
    localStorage.setItem('singwave_sheet_id', id);
  };

  // Setup / Update YouTube Player
  useEffect(() => {
    if (!currentSong?.youtubeId) return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 200);
        return;
      }

      if (playerRef.current) {
        try {
          playerRef.current.loadVideoById({
            videoId: currentSong.youtubeId,
            startSeconds: 0
          });
          playerRef.current.setPlaybackRate(playbackRate);
        } catch (e) {
          console.warn("Error updating video:", e);
        }
        return;
      }

      playerRef.current = new window.YT.Player('yt-player-container', {
        height: '100%',
        width: '100%',
        videoId: currentSong.youtubeId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1
        },
        events: {
          onReady: (event) => {
            setPlayerReady(true);
            event.target.setPlaybackRate(playbackRate);
            if (isPlaying && !showStageIntro) {
              event.target.playVideo();
            }
          },
          onStateChange: (event) => {
            if (event.data === 0) {
              playSound('applause');
              playNextSong(roomId);
            }
          }
        }
      });
    };

    initPlayer();
  }, [currentSong?.youtubeId]);

  // Handle Playback rate update on player
  useEffect(() => {
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch (e) {}
    }
  }, [playbackRate]);

  // Handle Play / Pause sync
  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      try {
        if (isPlaying && !showStageIntro) {
          playerRef.current.playVideo();
        } else {
          playerRef.current.pauseVideo();
        }
      } catch (e) {}
    }
  }, [isPlaying, showStageIntro]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    updateRoomState(roomId, { isPlaying: nextState });
  };

  const handleNextSong = () => {
    playSound('drumroll');
    playNextSong(roomId);
  };

  const handlePitchChange = (pitch) => {
    updateRoomState(roomId, { activePitch: pitch });
  };

  const handlePlaybackRateChange = (rate) => {
    updateRoomState(roomId, { playbackRate: rate });
  };

  const copyGuestLink = () => {
    navigator.clipboard.writeText(guestUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col stage-gradient">
      {/* Stage Announcement Curtain / Modal */}
      {showStageIntro && currentSong && (
        <StageAnnouncement
          song={currentSong}
          onStart={() => {
            updateRoomState(roomId, { showStageIntro: false, isPlaying: true });
          }}
          onWait={(sec) => {
            console.log(`Waiting ${sec}s for singer`);
          }}
          onDismiss={() => {
            updateRoomState(roomId, { showStageIntro: false, isPlaying: true });
          }}
        />
      )}

      {/* Top TV Header Bar */}
      <header className="px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/30">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-display">
                  SingWave <span className="text-pink-500 text-xs px-2 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30">STAGE</span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">Live Karaoke Party & Song Request Engine</p>
            </div>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Soundboard */}
          <div className="hidden lg:block">
            <Soundboard />
          </div>

          {/* Google Sheet / Form Sync Button */}
          <button
            onClick={() => setShowGoogleSheetModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              googleSheetId
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {googleSheetId ? 'Google Sheet Active' : 'Google Sheet / Form'}
            </span>
          </button>

          {/* Firebase Connection Pill */}
          <button
            onClick={() => setShowFirebaseModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              isFirebaseReady()
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isFirebaseReady() ? 'Firebase Cloud' : 'Local Sync'}
            </span>
          </button>

          {/* QR Code Quick View button */}
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-xs font-bold shadow-md shadow-pink-500/20 hover:scale-105 transition"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan to Request</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Toggle TV Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Switch to Guest preview */}
          <button
            onClick={onSwitchToGuest}
            className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-pink-400 px-2 py-1 rounded transition"
          >
            Guest Mobile View <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Left: Video Stage & Player */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main Stage Display */}
          <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-2xl flex items-center justify-center group">
            
            {currentSong?.youtubeId ? (
              <>
                <div id="yt-player-container" className="w-full h-full" />

                {/* Floating Singer & Mode HUD */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-none">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-pink-500/40 text-xs font-bold text-white shadow-lg">
                    <Mic className="w-3.5 h-3.5 text-pink-400" />
                    <span>Singer: {currentSong.singer}</span>
                  </div>

                  {currentSong.mode === 'open' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-xs font-bold text-cyan-300 shadow-lg">
                      <Users className="w-3.5 h-3.5" />
                      <span>Open Mic / Duet</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950/80 backdrop-blur-md border border-purple-500/40 text-xs font-bold text-purple-300 shadow-lg">
                      <Mic className="w-3.5 h-3.5" />
                      <span>Solo</span>
                    </div>
                  )}

                  {activePitch !== 0 && (
                    <div className="px-2.5 py-1.5 rounded-full bg-amber-950/80 backdrop-blur-md border border-amber-500/40 text-xs font-bold text-amber-300 shadow-lg">
                      Key: {activePitch > 0 ? `+${activePitch}` : activePitch} st
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Empty Stage Standby Screen
              <div className="text-center p-8 max-w-md">
                <div className="w-20 h-20 rounded-3xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center mx-auto mb-4 glow-pink animate-pulse">
                  <Mic className="w-10 h-10 text-pink-400" />
                </div>
                <h2 className="text-3xl font-black text-white font-display mb-2">
                  The Stage is Ready!
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Scan the QR code to request your favorite song, choose solo or duet, and pick your pitch!
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {queue.length > 0 ? (
                    <button
                      onClick={handleNextSong}
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition"
                    >
                      <Play className="w-5 h-5 fill-current" /> Start Queue ({queue.length} Songs Waiting)
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
                    >
                      <Plus className="w-4 h-4" /> Pick a Starter Hit
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Playback Controls & Pitch Shifter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Host Transport Controls */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Stage Controls
                </div>
                {currentSong && (
                  <span className="text-xs text-pink-400 font-medium truncate max-w-[200px]">
                    {currentSong.title} - {currentSong.artist}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 py-2">
                <button
                  onClick={() => {
                    if (playerRef.current && playerRef.current.seekTo) {
                      playerRef.current.seekTo(0);
                    }
                  }}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Restart Song"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white shadow-lg shadow-pink-500/30 transition active:scale-95"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNextSong}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Next Song in Queue"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center text-xs text-slate-400">
                {currentSong ? (
                  <span>
                    Singing: <strong className="text-white">{currentSong.singer}</strong> ({currentSong.mode === 'open' ? 'Open Mic' : 'Solo'})
                  </span>
                ) : (
                  <span>No song currently playing</span>
                )}
              </div>
            </div>

            {/* Real-Time Pitch & Key Shifter */}
            <PitchControl
              activePitch={activePitch}
              playbackRate={playbackRate}
              onChangePitch={handlePitchChange}
              onChangePlaybackRate={handlePlaybackRateChange}
            />
          </div>

        </div>

        {/* Right: QR Code & Live Queue */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Prominent QR Code Banner (clean, zero unnecessary PINs) */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Scan to request song"
                className="w-28 h-28 rounded-2xl bg-white p-1.5 shadow-md shrink-0 cursor-pointer hover:scale-105 transition"
                onClick={() => setShowQrModal(true)}
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-slate-800 animate-pulse shrink-0" />
            )}

            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
                <QrCode className="w-3.5 h-3.5" /> Scan To Sing
              </div>
              <h3 className="text-lg font-black text-white leading-tight font-display">
                Request on Phone
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan with any smartphone camera to browse, vote & request songs!
              </p>

              {/* Custom Guest Link (e.g. GitHub Pages or Google Form) */}
              <div className="mt-2.5">
                {editingGuestUrl ? (
                  <div className="flex gap-1.5 mt-1">
                    <input
                      type="text"
                      value={tempGuestUrl}
                      onChange={(e) => setTempGuestUrl(e.target.value)}
                      placeholder="Paste GitHub Pages or Form URL..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-pink-500"
                    />
                    <button
                      onClick={() => {
                        setCustomGuestUrl(tempGuestUrl.trim());
                        localStorage.setItem('singwave_custom_guest_url', tempGuestUrl.trim());
                        setEditingGuestUrl(false);
                      }}
                      className="px-2.5 py-1 bg-pink-500 text-white rounded-lg text-xs font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGuestUrl(false)}
                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempGuestUrl(customGuestUrl);
                      setEditingGuestUrl(true);
                    }}
                    className="text-[11px] text-slate-400 hover:text-pink-400 flex items-center gap-1 transition"
                  >
                    <span>Target: {customGuestUrl ? 'Custom (GitHub Pages)' : 'Local / Wi-Fi'}</span>
                    <span className="text-pink-400 font-semibold underline">Edit Link</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Queue Box with Vote Leaderboards */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl flex-1 flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-pink-400" />
                <h3 className="font-bold text-white font-display">
                  Live Queue ({queue.length})
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 px-2.5 py-1 rounded-lg border border-pink-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Song
              </button>
            </div>

            {/* Queue items */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {queue.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  <Music2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p>Queue is currently empty!</p>
                  <p className="text-slate-400 mt-1">Scan QR code or click "Add Song" to load up the party!</p>
                </div>
              ) : (
                queue.map((song, index) => {
                  const isOpen = song.mode === 'open';
                  const isTopVoted = index === 0 && (song.votes || 1) > 1;

                  return (
                    <div
                      key={song.id || index}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between group ${
                        isTopVoted
                          ? 'bg-gradient-to-r from-pink-950/40 to-slate-900 border-pink-500/50 shadow-md'
                          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                          isTopVoted ? 'bg-pink-500 text-white shadow-sm' : 'bg-slate-900 text-slate-400'
                        }`}>
                          #{index + 1}
                        </span>

                        <div className="overflow-hidden">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white truncate">
                              {song.title}
                            </h4>
                            {isTopVoted && (
                              <span className="text-[10px] font-black text-pink-400 bg-pink-500/20 px-1 rounded flex items-center gap-0.5">
                                <Flame className="w-3 h-3 fill-current" /> Top Voted
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-400 truncate">
                            {song.artist}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] font-semibold text-pink-300 bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-900/50">
                              🎤 {song.singer}
                            </span>

                            {isOpen ? (
                              <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-900/50">
                                👥 Open Mic ({song.votes || 1} votes)
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-900/50">
                                Solo
                              </span>
                            )}

                            {song.pitchShift !== 0 && (
                              <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/50">
                                {song.pitchShift > 0 ? `+${song.pitchShift}` : song.pitchShift} st
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const remaining = queue.filter((_, i) => i !== index);
                            updateRoomState(roomId, {
                              currentSong: song,
                              queue: remaining,
                              activePitch: song.pitchShift || 0,
                              isPlaying: true,
                              showStageIntro: true
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                          title="Play right now"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                        <button
                          onClick={() => removeFromQueue(roomId, song.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Fullscreen Big QR Code Modal (Clean - No PINs) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="relative max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
            <h3 className="text-2xl font-black text-white font-display mb-1">
              Scan to Request
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Use any smartphone camera to browse songs, vote & request
            </p>

            <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl mb-6">
              <img src={qrCodeDataUrl} alt="Room QR Code" className="w-64 h-64" />
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Quick Add Song Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="relative max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-display">
                Add from Karaoke Catalog
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {POPULAR_KARAOKE_SONGS.map((song) => (
                <div
                  key={song.id}
                  className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between hover:border-pink-500/50 transition"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white">{song.title}</h4>
                    <p className="text-xs text-slate-400">{song.artist} • {song.genre}</p>
                  </div>
                  <button
                    onClick={() => {
                      requestSong(roomId, {
                        title: song.title,
                        artist: song.artist,
                        youtubeId: song.youtubeId,
                        singer: 'Host / Guest Pick',
                        mode: 'open',
                        pitchShift: 0
                      });
                      setShowAddModal(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold"
                  >
                    + Add to Queue
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Google Sheet Modal */}
      <GoogleSheetModal
        isOpen={showGoogleSheetModal}
        onClose={() => setShowGoogleSheetModal(false)}
        currentSheetId={googleSheetId}
        onSaveSheetId={handleSaveSheetId}
        queue={queue}
        currentSong={currentSong}
      />

      {/* Firebase Modal */}
      <FirebaseModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        user={user}
      />
    </div>
  );
}
