// Database type definitions for Supabase

export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          created_at: string;
          last_active: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          last_active?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          last_active?: string;
          metadata?: Record<string, any> | null;
        };
      };
      travelers: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          age: number;
          mobility: 'high' | 'medium' | 'low';
          relationship: string | null;
          interests: string[] | null;
          cultural_background: string | null;
          dietary_restrictions: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          age: number;
          mobility?: 'high' | 'medium' | 'low';
          relationship?: string | null;
          interests?: string[] | null;
          cultural_background?: string | null;
          dietary_restrictions?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          age?: number;
          mobility?: 'high' | 'medium' | 'low';
          relationship?: string | null;
          interests?: string[] | null;
          cultural_background?: string | null;
          dietary_restrictions?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          session_id: string;
          title: string;
          destination: string | null;
          traveler_ids: string[];
          conversation: any; // JSONB
          ai_models_used: string[] | null;
          planning_stage: 'initial' | 'detailed' | 'finalized';
          created_at: string;
          updated_at: string;
          metadata: Record<string, any> | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          title: string;
          destination?: string | null;
          traveler_ids: string[];
          conversation: any;
          ai_models_used?: string[] | null;
          planning_stage?: 'initial' | 'detailed' | 'finalized';
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          title?: string;
          destination?: string | null;
          traveler_ids?: string[];
          conversation?: any;
          ai_models_used?: string[] | null;
          planning_stage?: 'initial' | 'detailed' | 'finalized';
          created_at?: string;
          updated_at?: string;
          metadata?: Record<string, any> | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      mobility_level: 'high' | 'medium' | 'low';
      planning_stage: 'initial' | 'detailed' | 'finalized';
    };
  };
}