// Core types for FlexiTrip application

export interface Session {
  id: string;
  created_at: string;
  last_active: string;
  metadata?: Record<string, any>;
}

export interface Traveler {
  id: string;
  session_id: string;
  name: string;
  age: number;
  mobility: 'high' | 'medium' | 'low';
  relationship?: string;
  interests?: string[];
  cultural_background?: string;
  dietary_restrictions?: string[];
  created_at: string;
  updated_at: string;
}

export interface Trip {
  id: string;
  session_id: string;
  title: string;
  destination?: string;
  traveler_ids: string[];
  conversation: ChatMessage[];
  ai_models_used?: string[];
  planning_stage: 'initial' | 'detailed' | 'finalized';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  structured_recommendations?: any[];
  metadata?: {
    model_used?: string;
    tokens_used?: number;
    response_time?: number;
  };
}

// Form types (onboarding replaced by sidebar integration)

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SessionResponse extends ApiResponse {
  data: {
    sessionId: string;
    travelers: Traveler[];
    trips: Trip[];
  };
}

// Utility types
export type TravelerFormData = Omit<Traveler, 'id' | 'session_id' | 'created_at' | 'updated_at'>;
export type TripFormData = Omit<Trip, 'id' | 'session_id' | 'created_at' | 'updated_at'>;

// Constants
export const MOBILITY_OPTIONS = ['high', 'medium', 'low'] as const;
export const RELATIONSHIP_OPTIONS = [
  'myself',
  'spouse',
  'child',
  'parent',
  'grandparent',
  'grandchild',
  'sibling',
  'friend',
  'other'
] as const;

export const INTEREST_OPTIONS = [
  'animals',
  'playgrounds',
  'museums',
  'sports',
  'art',
  'music',
  'nature',
  'science',
  'history'
] as const;

export const CULTURAL_OPTIONS = [
  'indian',
  'chinese',
  'middle_eastern',
  'italian',
  'mexican',
  'western',
  'other'
] as const;

export const DIETARY_OPTIONS = [
  'vegetarian',
  'vegan',
  'halal',
  'kosher',
  'gluten_free',
  'dairy_free',
  'nut_free'
] as const;