-- FlexiTrip Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Sessions table (anonymous user sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Travelers table (family members)
CREATE TABLE IF NOT EXISTS travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 50),
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  
  -- Mobility and accessibility
  mobility TEXT CHECK (mobility IN ('high', 'medium', 'low')) DEFAULT 'high',
  
  -- Relationships and preferences
  relationship TEXT, -- myself, spouse, child, parent, grandparent, grandchild, sibling, friend
  interests TEXT[], -- animals, playgrounds, museums, sports, art, music, nature, science, history
  
  -- Cultural and dietary considerations
  cultural_background TEXT, -- indian, chinese, middle_eastern, italian, mexican, western, other
  dietary_restrictions TEXT[], -- vegetarian, vegan, halal, kosher, gluten_free, dairy_free, nut_free
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table (saved conversations and planning sessions)
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Trip details
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  destination TEXT, -- Can be null for general planning
  traveler_ids UUID[] NOT NULL, -- Array of traveler IDs for this specific trip
  
  -- Conversation data
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of chat messages
  
  -- AI and planning metadata
  ai_models_used TEXT[], -- Track which AI models were used
  planning_stage TEXT DEFAULT 'initial' CHECK (planning_stage IN ('initial', 'detailed', 'finalized')),
  
  -- Timestamps and metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb -- For future extensions (bookings, weather, etc.)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_travelers_session_id ON travelers(session_id);
CREATE INDEX IF NOT EXISTS idx_travelers_age ON travelers(age); -- For age-based queries
CREATE INDEX IF NOT EXISTS idx_trips_session_id ON trips(session_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);

-- Text search indexes for future search functionality
CREATE INDEX IF NOT EXISTS idx_trips_title_search ON trips USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_travelers_name_search ON travelers USING gin(to_tsvector('english', name));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_travelers_updated_at ON travelers;
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;

-- Create triggers
CREATE TRIGGER update_travelers_updated_at 
    BEFORE UPDATE ON travelers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for old sessions (run via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions 
    WHERE last_active < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS) for basic security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (open for MVP, can be restricted later)
-- For now, we'll allow all operations since we're using session-based isolation
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on travelers" ON travelers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on trips" ON trips
    FOR ALL USING (true) WITH CHECK (true);

-- Create a view for session data with travelers (optional, for convenience)
CREATE OR REPLACE VIEW session_with_travelers AS
SELECT 
    s.id as session_id,
    s.created_at as session_created,
    s.last_active,
    s.metadata as session_metadata,
    COALESCE(
        json_agg(
            json_build_object(
                'id', t.id,
                'name', t.name,
                'age', t.age,
                'mobility', t.mobility,
                'relationship', t.relationship,
                'interests', t.interests,
                'cultural_background', t.cultural_background,
                'dietary_restrictions', t.dietary_restrictions,
                'created_at', t.created_at,
                'updated_at', t.updated_at
            )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'::json
    ) as travelers
FROM sessions s
LEFT JOIN travelers t ON s.id = t.session_id
GROUP BY s.id, s.created_at, s.last_active, s.metadata;

-- Sample data for testing (optional - remove in production)
-- INSERT INTO sessions (id) VALUES ('00000000-0000-0000-0000-000000000001');
-- INSERT INTO travelers (session_id, name, age, relationship) VALUES 
--     ('00000000-0000-0000-0000-000000000001', 'John Doe', 45, 'myself'),
--     ('00000000-0000-0000-0000-000000000001', 'Jane Doe', 42, 'spouse'),
--     ('00000000-0000-0000-0000-000000000001', 'Little Doe', 8, 'child');

COMMENT ON TABLE sessions IS 'Anonymous user sessions for FlexiTrip application';
COMMENT ON TABLE travelers IS 'Family member profiles with age-specific attributes';
COMMENT ON TABLE trips IS 'Saved travel planning conversations and trip data';
COMMENT ON FUNCTION cleanup_old_sessions() IS 'Removes sessions inactive for more than 30 days';