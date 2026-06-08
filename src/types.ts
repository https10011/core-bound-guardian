export interface Relationship {
  id: string;
  user_id: string;
  name: string;
  nickname: string;
  birthday: string | null;
  anniversary: string | null;
  avatar_url: string;
  bio: string;
  hobbies: string[];
  favorites: Record<string, string>;
  lifestyle: string;
  my_avatar_url: string;
  my_name: string;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: string;
  user_id: string;
  title: string;
  description: string;
  memory_date: string | null;
  location: string;
  mood: string;
  photos: string[];
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  user_id: string;
  name: string;
  owner: 'mine' | 'theirs';
  cover_url: string;
  photos: string[];
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'personal' | 'relationship' | 'shared';
  color: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type Page = 'dashboard' | 'vault' | 'ourstory' | 'notes' | 'settings';
