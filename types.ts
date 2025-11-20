
export enum RelationshipType {
  GIRLFRIEND = 'Girlfriend',
  BOYFRIEND = 'Boyfriend',
  WIFE = 'Wife',
  HUSBAND = 'Husband',
  BEST_FRIEND = 'Best Friend',
  SECRET_ADMIRER = 'Secret Admirer'
}

export type ThemeId = 'midnight' | 'crimson' | 'pastel' | 'aurora' | 'sunset';

export type MoodType = 'Happy' | 'Flirty' | 'Annoyed' | 'Sad' | 'Excited' | 'Shy' | 'Neutral' | 'Romantic' | 'Cold';

export interface CharacterProfile {
  id: string; // Unique ID for storage
  createdAt: number;
  name: string;
  relationship: string;
  traits: string; // User input description
  themeId: ThemeId;
  visualPrompt?: string; // AI refined prompt for image
  avatarUrl?: string; // Base64 image
  intimacyLevel: 'normal' | 'explicit'; // Adult Depth
  tags?: string[]; // Personality tags for UI display
}

export interface UserProfile {
  name: string;
  avatarUrl: string;
  interests: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isTyping?: boolean;
  reactions?: string[]; // Array of emojis
}

export enum AppState {
  SETUP = 'SETUP',
  GENERATING_PROFILE = 'GENERATING_PROFILE',
  HOME = 'HOME',
  CHAT = 'CHAT',
  RANDOM_REVIEW = 'RANDOM_REVIEW',
  UPDATE_CHECK = 'UPDATE_CHECK'
}