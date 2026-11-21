// Dual-mode Real-Time Sync Service:
// 1. Firebase Cloud Firestore (if configured)
// 2. Instant Local BroadcastChannel + LocalStorage fallback (works 100% offline or locally across tabs/windows)

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  deleteDoc, 
  orderBy, 
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

let app = null;
let db = null;
let auth = null;
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('karaoke_sync_channel') 
  : null;

// Load stored Firebase config if present
export function getFirebaseConfig() {
  try {
    const stored = localStorage.getItem('singwave_firebase_config');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Could not read stored Firebase config", e);
  }
  return null;
}

export function saveFirebaseConfig(config) {
  try {
    localStorage.setItem('singwave_firebase_config', JSON.stringify(config));
    // Re-initialize
    initFirebase(config);
    return true;
  } catch (e) {
    console.error("Failed to save Firebase config", e);
    return false;
  }
}

export function initFirebase(customConfig = null) {
  const config = customConfig || getFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApps()[0];
      }
      db = getFirestore(app);
      auth = getAuth(app);
      return { initialized: true, mode: 'cloud' };
    } catch (err) {
      console.warn("Firebase initialization error, using local broadcast mode:", err);
    }
  }
  return { initialized: false, mode: 'local' };
}

// Initial attempt
initFirebase();

export function isFirebaseReady() {
  return !!(db && auth);
}

// Google Authentication
export async function loginWithGoogle() {
  if (!auth) {
    // Mock login for local mode
    const mockUser = {
      uid: 'host_' + Math.random().toString(36).substring(2, 8),
      displayName: 'Party Host (Local)',
      email: 'host@karaoke.party',
      photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    };
    localStorage.setItem('singwave_user', JSON.stringify(mockUser));
    return mockUser;
  }
  const provider = new GoogleAuthProvider();
  const res = await signInWithPopup(auth, provider);
  return res.user;
}

export async function logoutUser() {
  if (auth) {
    await signOut(auth);
  }
  localStorage.removeItem('singwave_user');
}

export function subscribeAuth(callback) {
  if (auth) {
    return onAuthStateChanged(auth, callback);
  } else {
    // Check local storage
    const stored = localStorage.getItem('singwave_user');
    callback(stored ? JSON.parse(stored) : null);
    return () => {};
  }
}

// Local storage room helper
function getLocalRoomData(roomId) {
  try {
    const raw = localStorage.getItem(`room_${roomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLocalRoomData(roomId, data) {
  try {
    localStorage.setItem(`room_${roomId}`, JSON.stringify(data));
    if (broadcast) {
      broadcast.postMessage({ type: 'ROOM_UPDATE', roomId, data });
    }
  } catch (e) {
    console.error("Local save error", e);
  }
}

// Subscribe to Room State (Queue, Current Song, Settings)
export function subscribeToRoom(roomId, onUpdate) {
  if (db) {
    // Firebase Cloud Firestore
    const roomDocRef = doc(db, 'rooms', roomId);
    return onSnapshot(roomDocRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      } else {
        // Create initial room state if missing
        const initial = {
          roomId,
          title: "Karaoke Night",
          createdAt: Date.now(),
          currentSong: null,
          isPlaying: false,
          activePitch: 0,
          playbackRate: 1.0,
          showStageIntro: false,
          queue: []
        };
        setDoc(roomDocRef, initial);
        onUpdate(initial);
      }
    });
  }

  // Local Broadcast + LocalStorage mode
  const loadLocal = () => {
    let data = getLocalRoomData(roomId);
    if (!data) {
      data = {
        roomId,
        title: "Karaoke Party Live",
        createdAt: Date.now(),
        currentSong: null,
        isPlaying: false,
        activePitch: 0,
        playbackRate: 1.0,
        showStageIntro: false,
        queue: [
          {
            id: 'demo_1',
            title: "Don't Stop Believin'",
            artist: "Journey",
            youtubeId: "1k8craCGpgs",
            singer: "Dave & Team",
            mode: "open", // 'open' or 'solo'
            duetPartners: ["Sarah", "Mike"],
            pitchShift: 0,
            note: "Warm-up sing-along! Join in!",
            timestamp: Date.now() - 60000,
            votes: 4
          },
          {
            id: 'demo_2',
            title: "Rolling in the Deep",
            artist: "Adele",
            youtubeId: "rYEDA3JcQqw",
            singer: "Emily",
            mode: "solo",
            duetPartners: [],
            pitchShift: 1,
            note: "Belt out the chorus!",
            timestamp: Date.now() - 30000,
            votes: 7
          }
        ]
      };
      saveLocalRoomData(roomId, data);
    }
    onUpdate(data);
  };

  loadLocal();

  const handleMessage = (event) => {
    if (event.data?.roomId === roomId) {
      loadLocal();
    }
  };

  const handleStorage = (e) => {
    if (e.key === `room_${roomId}`) {
      loadLocal();
    }
  };

  if (broadcast) broadcast.addEventListener('message', handleMessage);
  window.addEventListener('storage', handleStorage);

  return () => {
    if (broadcast) broadcast.removeEventListener('message', handleMessage);
    window.removeEventListener('storage', handleStorage);
  };
}

// Update Room State (e.g. current song, pitch, play state, stage intro)
export async function updateRoomState(roomId, updates) {
  if (db) {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, updates);
    return;
  }

  // Local
  const current = getLocalRoomData(roomId) || {};
  const updated = { ...current, ...updates };
  saveLocalRoomData(roomId, updated);
}

// Add a song request to Queue
export async function requestSong(roomId, requestData) {
  const newSong = {
    id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    title: requestData.title || "Unknown Track",
    artist: requestData.artist || "Karaoke",
    youtubeId: requestData.youtubeId || "1k8craCGpgs",
    singer: requestData.singer || "Anonymous Singer",
    mode: requestData.mode || "solo", // 'solo' or 'open'
    duetPartners: [],
    pitchShift: typeof requestData.pitchShift === 'number' ? requestData.pitchShift : 0,
    note: requestData.note || "",
    timestamp: Date.now(),
    votes: 1
  };

  if (db) {
    const roomRef = doc(db, 'rooms', roomId);
    const snap = await doc(db, 'rooms', roomId);
    // Firestore update array
    // For reliability across devices, fetch room and append
    const current = getLocalRoomData(roomId) || { queue: [] };
    const queue = [...(current.queue || []), newSong];
    await updateDoc(roomRef, { queue });
    return newSong;
  }

  // Local
  const room = getLocalRoomData(roomId) || { queue: [] };
  room.queue = [...(room.queue || []), newSong];
  saveLocalRoomData(roomId, room);
  return newSong;
}

// Join an open performance as Duet Partner (also adds +1 vote and bumps it up!)
export async function joinDuet(roomId, songId, partnerName) {
  if (!partnerName) return;

  const updater = (room) => {
    const q = room.queue || [];
    let updatedQ = q.map(song => {
      if (song.id === songId) {
        const partners = song.duetPartners || [];
        if (!partners.includes(partnerName)) {
          return { 
            ...song, 
            duetPartners: [...partners, partnerName],
            votes: (song.votes || 1) + 1 // Joining gives a bonus vote!
          };
        }
      }
      return song;
    });

    // Re-sort queue by votes
    updatedQ = sortQueueByVotes(updatedQ);

    let current = room.currentSong;
    if (current && current.id === songId) {
      const partners = current.duetPartners || [];
      if (!partners.includes(partnerName)) {
        current = { ...current, duetPartners: [...partners, partnerName] };
      }
    }

    return { ...room, queue: updatedQ, currentSong: current };
  };

  if (db) {
    const roomRef = doc(db, 'rooms', roomId);
    const room = getLocalRoomData(roomId) || {};
    const updated = updater(room);
    await updateDoc(roomRef, updated);
    return;
  }

  const room = getLocalRoomData(roomId) || {};
  const updated = updater(room);
  saveLocalRoomData(roomId, updated);
}

// Remove song from queue
export async function removeFromQueue(roomId, songId) {
  const room = getLocalRoomData(roomId) || {};
  const queue = (room.queue || []).filter(s => s.id !== songId);

  if (db) {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { queue });
    return;
  }

  room.queue = queue;
  saveLocalRoomData(roomId, room);
}

// Helper to sort queue by votes (highest votes come first, ties broken by earliest timestamp)
export function sortQueueByVotes(queue) {
  return [...queue].sort((a, b) => {
    const votesDiff = (b.votes || 0) - (a.votes || 0);
    if (votesDiff !== 0) return votesDiff;
    return (a.timestamp || 0) - (b.timestamp || 0);
  });
}

// Upvote a song - bumps it up towards the top of the queue!
export async function upvoteSong(roomId, songId) {
  const room = getLocalRoomData(roomId) || {};
  let queue = (room.queue || []).map(s => {
    if (s.id === songId) {
      return { ...s, votes: (s.votes || 0) + 1 };
    }
    return s;
  });

  // Re-sort so most voted songs rise to the top
  queue = sortQueueByVotes(queue);

  if (db) {
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { queue });
    return;
  }

  room.queue = queue;
  saveLocalRoomData(roomId, room);
}

// Advance to next song with Stage Introduction Card!
export async function playNextSong(roomId) {
  const room = getLocalRoomData(roomId) || {};
  const queue = room.queue || [];

  if (queue.length === 0) {
    const updates = {
      currentSong: null,
      isPlaying: false,
      showStageIntro: false
    };
    await updateRoomState(roomId, updates);
    return null;
  }

  const [nextSong, ...remainingQueue] = queue;
  const updates = {
    currentSong: nextSong,
    queue: remainingQueue,
    isPlaying: true,
    activePitch: nextSong.pitchShift || 0,
    showStageIntro: true // Triggers on-stage singer announcement!
  };

  await updateRoomState(roomId, updates);
  return nextSong;
}

