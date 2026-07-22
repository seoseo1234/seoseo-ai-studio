export interface WebApp {
  id: string;
  title: string;
  category: string;
  url: string;
  thumbnailUrl: string;
  sortOrder: number;
  isPinned: boolean;
  deletedAt?: string | null;
}

export interface AppCategory {
  id: number;
  name: string;
  sortOrder: number;
}

export interface AppHistory {
  id: number;
  appId: string;
  action: 'update' | 'delete';
  snapshot: WebApp;
  createdAt: string;
}

export type LinkStatus = 'checking' | 'online' | 'offline' | 'unknown';
