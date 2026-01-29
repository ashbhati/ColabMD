// Database types for Supabase

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  user_id: string | null;
  share_token: string | null;
  permission: 'view' | 'edit' | 'comment';
  created_at: string;
}

// Extended types with relations
export interface DocumentWithOwner extends Document {
  owner: Profile;
}

export interface DocumentWithShares extends Document {
  document_shares: DocumentShare[];
}

// Liveblocks types
export interface UserMeta {
  id: string;
  info: {
    name: string;
    email: string;
    avatar: string;
  };
}

export interface Presence {
  cursor: { x: number; y: number } | null;
  selection: { anchor: number; head: number } | null;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}
