import React, { useState } from 'react';
import { Flame, CheckCircle, Database, LogIn, ExternalLink, X } from 'lucide-react';
import { 
  getFirebaseConfig, 
  saveFirebaseConfig, 
  loginWithGoogle, 
  isFirebaseReady 
} from '../services/firebase';

export default function FirebaseModal({ isOpen, onClose, onConfigSaved, user }) {
  const currentConfig = getFirebaseConfig() || {};
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig.appId || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const config = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim()
    };

    saveFirebaseConfig(config);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onConfigSaved) onConfigSaved();
      onClose();
    }, 1200);
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Firebase & Google Integration</h2>
            <p className="text-xs text-slate-400">
              Live Cloud Firestore Sync + Google Authentication
            </p>
          </div>
        </div>

        {/* Current Status banner */}
        <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isFirebaseReady() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs font-semibold text-slate-200">
              {isFirebaseReady() ? 'Connected to Firebase Cloud' : 'Running in Zero-Config Local Broadcast Mode'}
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg text-xs transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            {user ? `Signed In (${user.displayName || 'Host'})` : 'Sign in with Google'}
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <p className="text-xs text-slate-400">
            Paste your Firebase project credentials from{' '}
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 underline inline-flex items-center gap-0.5"
            >
              Firebase Console <ExternalLink className="w-3 h-3" />
            </a>
            :
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project ID</label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="my-karaoke-app"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="my-karaoke-app.firebaseapp.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Tip: Local mode syncs seamlessly across browser windows and LAN devices!
            </span>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold transition shadow-lg shadow-pink-500/20"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" /> Saved & Connected!
                </>
              ) : (
                'Save Config'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

