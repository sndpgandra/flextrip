# FlexiTrip - Technical Architecture Plan (Final)

## Architecture Overview

### System Design Philosophy
FlexiTrip follows a **cost-optimized, progressive enhancement** architecture designed for rapid development by a solo developer while maintaining scalability for future growth.

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Next.js)     │    │   (API Routes)  │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Universal UI  │◄──►│ • Session API   │◄──►│ • OpenRouter AI │
│ • Q&A Onboard   │    │ • Travelers API │    │   (Multi-Model) │
│ • Chat Interface│    │ • Chat API      │    │ • Supabase DB   │
│ • Trip Manager  │    │ • Trips API     │    │ • Vercel Deploy │
│ • PWA Features  │    │ • Rate Limiting │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack

#### Frontend Stack
```typescript
// Core Framework
Next.js 14           // App Router, Server Components, Static Optimization
TypeScript 5+        // Type safety and developer experience
React 18             // UI library with concurrent features

// Styling & UI
Tailwind CSS 3+      // Utility-first CSS framework
shadcn/ui           // Accessible component library
Lucide React        // Icon library

// State & Data
React Hooks         // useState, useEffect, useContext for state
SWR / React Query   // Server state synchronization (Phase 2)
Zod                 // Runtime type validation

// PWA Features
next-pwa            // Progressive Web App capabilities
@vercel/analytics   // Performance and usage analytics
```

#### Backend Stack
```typescript
// Runtime & Framework
Node.js 18+         // JavaScript runtime
Next.js API Routes  // Serverless functions on Vercel
Vercel Functions    // Edge computing at global CDN

// Database & Auth
Supabase PostgreSQL // Primary database with real-time features
Supabase Auth       // Authentication (future enhancement)
UUID v4             // Session and entity identification

// AI & External APIs
OpenRouter.ai       // Multi-model AI access (Claude, GPT, etc.)
Anthropic Claude    // Primary AI model
OpenAI GPT-4o mini  // Fallback AI model

// Validation & Security
Zod                 // Schema validation
bcrypt              // Password hashing (future)
Rate limiting       // Request throttling
```

#### Infrastructure Stack
```yaml
Hosting: Vercel (Free Tier)
  - Global CDN
  - Automatic deployments
  - Edge functions
  - Analytics included

Database: Supabase (Free Tier)
  - PostgreSQL with extensions
  - Real-time subscriptions
  - Automatic backups
  - Row Level Security

Domain: Custom domain (~$12/year)
Monitoring: Vercel Analytics (Free)
Error Tracking: Next.js built-in error boundaries
```

## Database Architecture

### Entity Relationship Diagram

```
Sessions (1) ──────► (Many) Travelers
    │
    └──────► (Many) Trips
                │
                └──────► References ──────► Travelers (Many-to-Many via array)
```

### Complete Database Schema

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Sessions table (anonymous user sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For future extensions
);

-- Travelers table (family members)
CREATE TABLE travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 50),
  age INTEGER NOT NULL CHECK (age >= 1 AND age <= 120),
  
  -- Mobility and accessibility
  mobility TEXT CHECK (mobility IN ('high', 'medium', 'low')) DEFAULT 'high',
  accessibility_needs TEXT[], -- wheelchair, walker, hearing_aid, visual_aid
  
  -- Relationships and preferences
  relationship TEXT, -- myself, spouse, child, parent, grandparent, grandchild, sibling, friend
  interests TEXT[], -- animals, playgrounds, museums, sports, art, music, nature, science, history
  
  -- Cultural and dietary considerations
  cultural_background TEXT, -- indian, chinese, middle_eastern, italian, mexican, other
  dietary_restrictions TEXT[], -- vegetarian, vegan, halal, kosher, gluten_free, dairy_free, nut_free
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table (saved conversations and planning sessions)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Trip details
  title TEXT NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  destination TEXT, -- Can be null for general planning
  traveler_ids UUID[] NOT NULL, -- Array of traveler IDs for this specific trip
  
  -- Conversation data
  conversation JSONB NOT NULL DEFAULT '[]', -- Array of chat messages
  
  -- AI and planning metadata
  ai_models_used TEXT[], -- Track which AI models were used
  planning_stage TEXT DEFAULT 'initial' CHECK (planning_stage IN ('initial', 'detailed', 'finalized')),
  
  -- Timestamps and metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- For future extensions (bookings, weather, etc.)
);

-- Performance indexes
CREATE INDEX idx_travelers_session_id ON travelers(session_id);
CREATE INDEX idx_travelers_age ON travelers(age); -- For age-based queries
CREATE INDEX idx_trips_session_id ON trips(session_id);
CREATE INDEX idx_trips_created_at ON trips(created_at DESC);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);

-- Text search indexes for future search functionality
CREATE INDEX idx_trips_title_search ON trips USING gin(to_tsvector('english', title));
CREATE INDEX idx_travelers_name_search ON travelers USING gin(to_tsvector('english', name));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_travelers_updated_at 
    BEFORE UPDATE ON travelers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at 
    BEFORE UPDATE ON trips 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for old sessions (run via cron)
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
```

### Data Validation and Constraints

```sql
-- Additional validation functions
CREATE OR REPLACE FUNCTION validate_traveler_data()
RETURNS TRIGGER