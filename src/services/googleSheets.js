// Google Sheets Integration Service
// Professional Google Form & Google Sheet sync for Karaoke song requests

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

    const jsonString = text.replace(/^[/*O_o*/\s]*google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonString);

    if (!data.table || !data.table.rows) return [];

    const rows = data.table.rows;
    const parsedRequests = [];

    // Parse each row from Google Form:
    // [0] Timestamp, [1] Singer Name, [2] Song Title / YouTube link, [3] Solo or Open, [4] Pitch Shift, [5] Votes
    rows.forEach((row, index) => {
      if (!row.c) return;

      const getVal = (idx) => {
        const cell = row.c[idx];
        return cell && cell.v !== null && cell.v !== undefined ? String(cell.v).trim() : '';
      };

      const singer = getVal(1) || getVal(0) || `Singer ${index + 1}`;
      const songInput = getVal(2) || getVal(1) || "Don't Stop Believin'";
      const modeRaw = (getVal(3) || 'solo').toLowerCase();
      const mode = modeRaw.includes('open') || modeRaw.includes('duet') ? 'open' : 'solo';
      
      const pitchRaw = parseInt(getVal(4), 10);
      const pitchShift = isNaN(pitchRaw) ? 0 : Math.max(-4, Math.min(4, pitchRaw));
      
      const votesRaw = parseInt(getVal(5), 10);
      const votes = isNaN(votesRaw) ? 1 : Math.max(1, votesRaw);

      let ytId = extractYouTubeId(songInput);
      let title = songInput;
      let artist = 'Custom Request';

      if (!ytId) {
        const match = POPULAR_KARAOKE_SONGS.find(s => 
          songInput.toLowerCase().includes(s.title.toLowerCase()) || 
          s.title.toLowerCase().includes(songInput.toLowerCase())
        );
        if (match) {
          ytId = match.youtubeId;
          title = match.title;
          artist = match.artist;
        } else {
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

// Download a formatted starter Google Sheet template (CSV) with pre-configured columns
export function downloadGoogleSheetTemplate() {
  const headers = ['Timestamp', 'Singer Name', 'Song Title or YouTube URL', 'Performance Mode', 'Key Shift (Semitones)', 'Votes', 'Notes'];
  const sampleRows = [
    [new Date().toISOString(), 'Sarah Jenkins', "Don't Stop Believin' - Journey", 'Open Mic', '0', '4', 'Sing chorus together'],
    [new Date().toISOString(), 'David Ross', 'Bohemian Rhapsody - Queen', 'Solo', '+1', '7', 'High energy'],
    [new Date().toISOString(), 'Alex Kim', 'Rolling in the Deep - Adele', 'Open Mic', '-2', '3', 'Baritone key']
  ];

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...sampleRows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `karaoke_sheet_template.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Generate CSV export of current queue
export function exportQueueToCSV(queue = [], currentSong = null) {
  const headers = ['Order', 'Singer', 'Song Title', 'Artist', 'Mode (Solo/Open)', 'Pitch Shift (st)', 'Votes', 'Duet Partners', 'Time'];
  const rows = [];
  
  if (currentSong) {
    rows.push([
      'CURRENT',
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
  link.setAttribute('download', `karaoke_queue_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
