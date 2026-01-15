import { Instagram, Youtube, Linkedin, Facebook, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlatformPreset {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  icon: React.ReactNode;
  aspectRatio: string;
}

export const platformPresets: PlatformPreset[] = [
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'Instagram',
    width: 1080,
    height: 1080,
    icon: <Instagram className="w-6 h-6" />,
    aspectRatio: '1:1'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    platform: 'Instagram',
    width: 1080,
    height: 1920,
    icon: <Instagram className="w-6 h-6" />,
    aspectRatio: '9:16'
  },
  {
    id: 'youtube-thumbnail',
    name: 'YouTube Thumbnail',
    platform: 'YouTube',
    width: 1280,
    height: 720,
    icon: <Youtube className="w-6 h-6" />,
    aspectRatio: '16:9'
  },
  {
    id: 'youtube-shorts',
    name: 'YouTube Shorts',
    platform: 'YouTube',
    width: 1080,
    height: 1920,
    icon: <Youtube className="w-6 h-6" />,
    aspectRatio: '9:16'
  },
  {
    id: 'facebook-post',
    name: 'Facebook Post',
    platform: 'Facebook',
    width: 1200,
    height: 630,
    icon: <Facebook className="w-6 h-6" />,
    aspectRatio: '1.91:1'
  },
  {
    id: 'facebook-cover',
    name: 'Facebook Cover',
    platform: 'Facebook',
    width: 1640,
    height: 859,
    icon: <Facebook className="w-6 h-6" />,
    aspectRatio: '16:9'
  },
  {
    id: 'facebook-story',
    name: 'Facebook Story',
    platform: 'Facebook',
    width: 1080,
    height: 1920,
    icon: <Facebook className="w-6 h-6" />,
    aspectRatio: '9:16'
  },
  {
    id: 'twitter-post',
    name: 'Twitter/X Post',
    platform: 'Twitter',
    width: 1200,
    height: 675,
    icon: <Twitter className="w-6 h-6" />,
    aspectRatio: '16:9'
  },
  {
    id: 'twitter-header',
    name: 'Twitter/X Header',
    platform: 'Twitter',
    width: 1500,
    height: 500,
    icon: <Twitter className="w-6 h-6" />,
    aspectRatio: '3:1'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    platform: 'LinkedIn',
    width: 1200,
    height: 627,
    icon: <Linkedin className="w-6 h-6" />,
    aspectRatio: '1.91:1'
  },
  {
    id: 'tiktok-video',
    name: 'TikTok Video',
    platform: 'TikTok',
    width: 1080,
    height: 1920,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    aspectRatio: '9:16'
  },
  {
    id: 'linkedin-profile',
    name: 'LinkedIn Profile',
    platform: 'LinkedIn',
    width: 400,
    height: 400,
    icon: <Linkedin className="w-6 h-6" />,
    aspectRatio: '1:1'
  },
  {
    id: 'pinterest-pin',
    name: 'Pinterest Pin',
    platform: 'Pinterest',
    width: 1000,
    height: 1500,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c5.302 0 9.917-3.176 11.827-7.73-.11-.938-.885-1.956-1.827-2.73v-.002c-.307-.26-.734-.5-1.283-.688a4.67 4.67 0 0 0-.748-.217c-.301-.09-.618-.153-.94-.188a4.394 4.394 0 0 0-.532-.04c-.178-.01-.357-.015-.537-.015-.178 0-.357.005-.535.015a4.394 4.394 0 0 0-.532.04c-.322.035-.639.098-.94.188a4.67 4.67 0 0 0-.748.217c-.549.188-.976.428-1.283.688v.002c-.942.774-1.717 1.792-1.827 2.73C2.083 20.824 6.698 24 12 24c6.628 0 12-5.372 12-12S18.628 0 12 0z"/>
      </svg>
    ),
    aspectRatio: '2:3'
  },
  {
    id: 'pinterest-board',
    name: 'Pinterest Board',
    platform: 'Pinterest',
    width: 1000,
    height: 1000,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.372 0 12s5.373 12 12 12c5.302 0 9.917-3.176 11.827-7.73-.11-.938-.885-1.956-1.827-2.73v-.002c-.307-.26-.734-.5-1.283-.688a4.67 4.67 0 0 0-.748-.217c-.301-.09-.618-.153-.94-.188a4.394 4.394 0 0 0-.532-.04c-.178-.01-.357-.015-.537-.015-.178 0-.357.005-.535.015a4.394 4.394 0 0 0-.532.04c-.322.035-.639.098-.94.188a4.67 4.67 0 0 0-.748.217c-.549.188-.976.428-1.283.688v.002c-.942.774-1.717 1.792-1.827 2.73C2.083 20.824 6.698 24 12 24c6.628 0 12-5.372 12-12S18.628 0 12 0z"/>
      </svg>
    ),
    aspectRatio: '1:1'
  },
  {
    id: 'snapchat-ad',
    name: 'Snapchat Ad',
    platform: 'Snapchat',
    width: 1080,
    height: 1920,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.15c-.012.75-.024 1.486.301 2.203.23.51.596.96 1.05 1.31.48.37 1.08.64 1.73.64.19 0 .38-.02.57-.06 1.16-.22 2.13-1.06 2.58-2.18.3-.75.35-1.56.14-2.34-.21-.78-.66-1.47-1.29-1.97-.63-.5-1.4-.78-2.21-.78-.19 0-.38.02-.57.06-.36.07-.71.18-1.03.32-.32.14-.62.31-.89.51-.27.2-.51.43-.71.69-.2.26-.36.54-.48.84-.12.3-.2.62-.24.95-.04.33-.04.66 0 .99.04.33.12.65.24.95.12.3.28.58.48.84.2.26.44.49.71.69.27.2.57.37.89.51.32.14.67.25 1.03.32.19.04.38.06.57.06.81 0 1.58-.28 2.21-.78.63-.5 1.08-1.19 1.29-1.97.21-.78.16-1.59-.14-2.34-.45-1.12-1.42-1.96-2.58-2.18-.19-.04-.38-.06-.57-.06-.65 0-1.25.27-1.73.64-.45.35-.82.8-1.05 1.31-.33.72-.31 1.45-.3 2.2l.002.15c.104 1.63.23 3.66-.3 4.85-1.58 3.55-4.94 3.83-5.93 3.83-.99 0-4.35-.28-5.93-3.83-.53-1.19-.4-3.22-.3-4.85l.003-.15c.012-.75.024-1.48-.3-2.2-.23-.51-.6-.96-1.05-1.31-.48-.37-1.08-.64-1.73-.64-.19 0-.38.02-.57.06-1.16.22-2.13 1.06-2.58 2.18-.3.75-.35 1.56-.14 2.34.21.78.66 1.47 1.29 1.97.63.5 1.4.78 2.21.78.19 0 .38-.02.57-.06.36-.07.71-.18 1.03-.32.32-.14.62-.31.89-.51.27-.2.51-.43.71-.69.2-.26.36-.54.48-.84.12-.3.2-.62.24-.95.04-.33.04-.66 0-.99-.04-.33-.12-.65-.24-.95-.12-.3-.28-.58-.48-.84-.2-.26-.44-.49-.71-.69-.27-.2-.57-.37-.89-.51-.32-.14-.67-.25-1.03-.32-.19-.04-.38-.06-.57-.06-.81 0-1.58.28-2.21.78-.63.5-1.08 1.19-1.29 1.97-.21.78-.16 1.59.14 2.34.45 1.12 1.42 1.96 2.58 2.18.19.04.38.06.57.06.65 0 1.25-.27 1.73-.64.45-.35.82-.8 1.05-1.31.33-.72.31-1.45.3-2.2l-.002-.15c-.104-1.63-.23-3.66.3-4.85C7.856 1.07 11.216.793 12.206.793z"/>
      </svg>
    ),
    aspectRatio: '9:16'
  },
  {
    id: 'discord-banner',
    name: 'Discord Banner',
    platform: 'Discord',
    width: 960,
    height: 540,
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
      </svg>
    ),
    aspectRatio: '16:9'
  }
];

interface PlatformPresetCardProps {
  preset: PlatformPreset;
  selected: boolean;
  onClick: () => void;
}

export function PlatformPresetCard({ preset, selected, onClick }: PlatformPresetCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all hover:shadow-md",
        selected 
          ? "border-blue-500 bg-blue-50 shadow-md" 
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-12 h-12 rounded-lg",
        selected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
      )}>
        {preset.icon}
      </div>
      <div className="text-left">
        <div className="font-semibold text-gray-900">{preset.name}</div>
        <div className="text-sm text-gray-500 mt-1">
          {preset.width} × {preset.height}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {preset.aspectRatio}
        </div>
      </div>
    </button>
  );
}
