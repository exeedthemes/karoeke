import React, { useState, useEffect } from 'react';
import HostView from './components/HostView';
import GuestView from './components/GuestView';
import { subscribeToRoom, subscribeAuth } from './services/firebase';

export default function App() {
  const [roomId, setRoomId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'PARTY-88';
  });

  const [currentView, setCurrentView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    // If scanned via QR code or requested with view=guest or on mobile, show guest view
    if (params.get('view') === 'guest') return 'guest';
    if (window.innerWidth < 768 && params.has('room')) return 'guest';
    return 'host';
  });

  const [roomData, setRoomData] = useState(null);
  const [user, setUser] = useState(null);

  // Subscribe to real-time room data (Firebase cloud or local broadcast)
  useEffect(() => {
    const unsubscribe = subscribeToRoom(roomId, (data) => {
      setRoomData(data);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId]);

  // Subscribe to auth state
  useEffect(() => {
    const unsubscribeAuth = subscribeAuth((u) => {
      setUser(u);
    });
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const handleSwitchToGuest = () => {
    setCurrentView('guest');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'guest');
    window.history.pushState({}, '', url);
  };

  const handleSwitchToHost = () => {
    setCurrentView('host');
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.history.pushState({}, '', url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {currentView === 'host' ? (
        <HostView
          roomData={roomData}
          roomId={roomId}
          onSwitchToGuest={handleSwitchToGuest}
          user={user}
        />
      ) : (
        <GuestView
          roomData={roomData}
          roomId={roomId}
          onSwitchToHost={handleSwitchToHost}
          user={user}
        />
      )}
    </div>
  );
}

