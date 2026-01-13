export interface PlatformPreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  icon: string;
  description: string;
}

export const platformPresets: PlatformPreset[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'Instagram',
    width: 1080,
    height: 1080,
    icon: '📷',
    description: 'Square post (1:1)',
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story/Reels',
    platform: 'Instagram',
    width: 1080,
    height: 1920,
    icon: '📱',
    description: 'Vertical (9:16)',
  },
  {
    id: 'instagram-landscape',
    name: 'Instagram Landscape',
    platform: 'Instagram',
    width: 1080,
    height: 566,
    icon: '🖼️',
    description: 'Landscape (1.91:1)',
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    platform: 'YouTube',
    width: 1280,
    height: 720,
    icon: '▶️',
    description: 'HD Thumbnail (16:9)',
  },
  {
    id: 'youtube-banner',
    name: 'YouTube Banner',
    platform: 'YouTube',
    width: 2560,
    height: 1440,
    icon: '🎬',
    description: 'Channel art',
  },
  {
    id: 'tiktok-video',
    name: 'TikTok Video',
    platform: 'TikTok',
    width: 1080,
    height: 1920,
    icon: '🎵',
    description: 'Vertical (9:16)',
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    platform: 'LinkedIn',
    width: 1200,
    height: 627,
    icon: '💼',
    description: 'Landscape (1.91:1)',
  },
  {
    id: 'linkedin-profile',
    name: 'LinkedIn Profile',
    platform: 'LinkedIn',
    width: 400,
    height: 400,
    icon: '👤',
    description: 'Profile photo (1:1)',
  },
  {
    id: 'twitter-post',
    name: 'X/Twitter Post',
    platform: 'X/Twitter',
    width: 1200,
    height: 675,
    icon: '🐦',
    description: 'In-stream photo (16:9)',
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    platform: 'Facebook',
    width: 1200,
    height: 630,
    icon: '👍',
    description: 'Shared image',
  },
];

export type BackgroundFillType = 'blur' | 'solid' | 'gradient' | 'transparent';

export interface BackgroundFillOption {
  id: BackgroundFillType;
  name: string;
  description: string;
  icon: string;
}

export const backgroundFillOptions: BackgroundFillOption[] = [
  {
    id: 'blur',
    name: 'Auto Blur',
    description: 'Blurred version of image',
    icon: '🌫️',
  },
  {
    id: 'solid',
    name: 'Solid Color',
    description: 'Pick a background color',
    icon: '🎨',
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Smooth color transition',
    icon: '🌈',
  },
  {
    id: 'transparent',
    name: 'Transparent',
    description: 'No background (PNG)',
    icon: '✨',
  },
];
