// Google Sheets & Google Forms Live Integration
// 100% Zero-Firebase solution:
// - Guests request songs via a Google Form / Google Page
// - Submissions write to Google Sheets
// - Host on localhost polls Google Sheets & plays karaoke on YouTube with pitch shift & votes sorting!

import { sortQueueByVotes } from './firebase';
import { extractYouTubeId, POPULAR_KARAOKE_SONGS } from './catalog';

// Helper to extract Sheet ID from Google Sheet / Google Form URL
export function extractGoogleSheetId(urlOrId) {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return '';
}

// Fetch live rows from a public or "Anyone with link" Google Sheet
export async function fetchGoogleSheetRequests(sheetId) {
  if (!sheetId) return [];
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
    const res = await fetch(url);
    const text = await res.text();

    // Google Visualization API returns: /*O_o*/ google.visualization.Query.setResponse({...});
    const jsonString = text.replace(/^[/*O_o*/\s]*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonString);

    if (!data.table || !data.table.rows) return [];

    const rows = data.table.rows;
    const parsedRequests = [];

    // Parse each row from Google Form:
    // [0] Timestamp, [1] Singer Name, [2] Song Title / YouTube link, [3] Solo or Open, [4] Pitch Shift, [5] Votes (optional)
    rows.forEach((row, index) => {
      if (!row.c) return;

      const getVal = (idx) => {
        const cell = row.c[idx];
        return cell && cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : '';
      };

      const singer = getVal(1) || getVal(0) || `Guest Singer #${index + 1}`;
      const songInput = getVal(2) || getVal(1) || "Don't Stop Believin'";
      const modeRaw = (getVal(3) || 'solo').toLowerCase();
      const mode = modeRaw.includes('open') || modeRaw.includes('duet') ? 'open' : 'solo';
      
      const pitchRaw = parseInt(getVal(4), 10);
      const pitchShift = isNaN(pitchRaw) ? 0 : Math.max(-4, Math.min(4, pitchRaw));
      
      const votesRaw = parseInt(getVal(5), 10);
      const votes = isNaN(votesRaw) ? 1 : Math.max(1, votesRaw);

      // Match YouTube ID
      let ytId = extractYouTubeId(songInput);
      let title = songInput;
      let artist = 'Karaoke Request';

      if (!ytId) {
        // Try catalog match
        const match = POPULAR_KARAOKE_SONGS.find(s => 
          songInput.toLowerCase().includes(s.title.toLowerCase()) || 
          s.title.toLowerCase().includes(songInput.toLowerCase())
        );
        if (match) {
          ytId = match.youtubeId;
          title = match.title;
          artist = match.artist;
        } else {
          // Default to Queen Bohemian Rhapsody or Journey
          ytId = POPULAR_KARAOKE_SONGS[index % POPULAR_KARAOKE_SONGS.length].youtubeId;
          title = songInput;
        }
      }

      parsedRequests.push({
        id: `gsheet_${index}_${singer}`,
        singer,
        title,
        artist,
        youtubeId: ytId,
        mode,
        pitchShift,
        votes,
        timestamp: Date.now() - (rows.length - index) * 10000,
        duetPartners: []
      });
    });

    return parsedRequests;
  } catch (err) {
    console.warn("Could not fetch Google Sheet rows:", err);
    return [];
  }
}

// Generate CSV to download or paste directly into Google Sheets
export function exportQueueToCSV(queue = [], currentSong = null) {
  const headers = ['Order', 'Singer', 'Song Title', 'Artist', 'Mode (Solo/Open)', 'Pitch Shift (st)', 'Votes', 'Duet Partners', 'Time'];
  const rows = [];
  
  if (currentSong) {
    rows.push([
      'NOW PLAYING',
      currentSong.singer || '',
      `"${(currentSong.title || '').replace(/"/g, '""')}"`,
      `"${(currentSong.artist || '').replace(/"/g, '""')}"`,
      currentSong.mode === 'open' ? 'Open Mic / Duet' : 'Solo',
      currentSong.pitchShift || 0,
      currentSong.votes || 1,
      `"${(currentSong.duetPartners || []).join(', ')}"`,
      new Date(currentSong.timestamp || Date.now()).toLocaleTimeString()
    ]);
  }

  queue.forEach((item, idx) => {
    rows.push([
      idx + 1,
      item.singer || '',
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.artist || '').replace(/"/g, '""')}"`,
      item.mode === 'open' ? 'Open Mic / Duet' : 'Solo',
      item.pitchShift || 0,
      item.votes || 1,
      `"${(item.duetPartners || []).join(', ')}"`,
      new Date(item.timestamp || Date.now()).toLocaleTimeString()
    ]);
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `karaoke_requests_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
