// Curated list of high-quality YouTube Karaoke backing tracks with lyrics
// Users can also search or enter ANY YouTube / YouTube Music URL

export const KARAOKE_CATEGORIES = [
  'All',
  'Crowd Pleasers',
  'Pop Hits',
  'Rock Anthems',
  '80s & 90s',
  'Duets & Groups',
  'Ballads & Soul'
];

export const POPULAR_KARAOKE_SONGS = [
  {
    id: 'k1',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    genre: 'Rock Anthems',
    youtubeId: 'fJ9rUzIMcZQ', // Queen official karaoke
    duration: '5:55',
    tag: 'Epic'
  },
  {
    id: 'k2',
    title: "Don't Stop Believin'",
    artist: 'Journey',
    genre: 'Rock Anthems',
    youtubeId: '1k8craCGpgs',
    duration: '4:11',
    tag: 'Classic'
  },
  {
    id: 'k3',
    title: 'Sweet Caroline',
    artist: 'Neil Diamond',
    genre: 'Crowd Pleasers',
    youtubeId: '1vhFnTjia_I',
    duration: '3:21',
    tag: 'Party Favorite'
  },
  {
    id: 'k4',
    title: 'I Want It That Way',
    artist: 'Backstreet Boys',
    genre: 'Pop Hits',
    youtubeId: '4fndeDfaWCg',
    duration: '3:33',
    tag: '90s Gold'
  },
  {
    id: 'k5',
    title: 'Shallow',
    artist: 'Lady Gaga & Bradley Cooper',
    genre: 'Duets & Groups',
    youtubeId: 'bo_efYhZY2Q',
    duration: '3:37',
    tag: 'Duet Pick'
  },
  {
    id: 'k6',
    title: 'Dancing Queen',
    artist: 'ABBA',
    genre: '80s & 90s',
    youtubeId: 'xFrGuyw1Vm8',
    duration: '3:50',
    tag: 'Disco Hit'
  },
  {
    id: 'k7',
    title: 'Rolling in the Deep',
    artist: 'Adele',
    genre: 'Ballads & Soul',
    youtubeId: 'rYEDA3JcQqw',
    duration: '3:48',
    tag: 'Vocal Showcase'
  },
  {
    id: 'k8',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    genre: 'Pop Hits',
    youtubeId: 'OPf0YbXqDm0',
    duration: '4:30',
    tag: 'High Energy'
  },
  {
    id: 'k9',
    title: 'Ain’t No Mountain High Enough',
    artist: 'Marvin Gaye & Tammi Terrell',
    genre: 'Duets & Groups',
    youtubeId: 'ICbfaFqK1l8',
    duration: '2:30',
    tag: 'Classic Duet'
  },
  {
    id: 'k10',
    title: 'Livin’ on a Prayer',
    artist: 'Bon Jovi',
    genre: 'Rock Anthems',
    youtubeId: 'lDK9QqIzhwk',
    duration: '4:09',
    tag: 'Scream Along'
  },
  {
    id: 'k11',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    genre: 'Pop Hits',
    youtubeId: 'G7KNmW9a75Y',
    duration: '3:20',
    tag: 'Modern Pop'
  },
  {
    id: 'k12',
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    genre: '80s & 90s',
    youtubeId: 'Zi_XLOBDo_Y',
    duration: '4:54',
    tag: 'Dance Classic'
  },
  {
    id: 'k13',
    title: 'Someone Like You',
    artist: 'Adele',
    genre: 'Ballads & Soul',
    youtubeId: 'hLQl3WQQoQ0',
    duration: '4:45',
    tag: 'Emotional'
  },
  {
    id: 'k14',
    title: 'Wonderwall',
    artist: 'Oasis',
    genre: 'Rock Anthems',
    youtubeId: '6hzrDeceEKc',
    duration: '4:18',
    tag: 'Acoustic Sing-along'
  },
  {
    id: 'k15',
    title: 'Can’t Stop the Feeling!',
    artist: 'Justin Timberlake',
    genre: 'Crowd Pleasers',
    youtubeId: 'ru0K8uYEZWw',
    duration: '3:56',
    tag: 'Feel Good'
  },
  {
    id: 'k16',
    title: 'Love Is An Open Door',
    artist: 'Frozen',
    genre: 'Duets & Groups',
    youtubeId: '80vPZgN1Jz8',
    duration: '2:07',
    tag: 'Disney Fun'
  }
];

// Helper to extract YouTube video ID from normal URLs, short URLs, or music.youtube.com links
export function extractYouTubeId(urlOrId) {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Handle standard youtube.com, youtu.be, and music.youtube.com URLs
  const regExp = /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|music\.youtube\.com\/watch\?v=)([^#&?]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : '';
}

