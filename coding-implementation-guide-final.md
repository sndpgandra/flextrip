# FlexiTrip - Coding Implementation Guide (Final)

## Overview
Build a Progressive Web App (PWA) for multi-generational travel planning with Q&A guided onboarding, age-aware AI recommendations, and cost-optimized architecture targeting $20-50/month operational costs.

## Tech Stack (Cost-Optimized)
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Vercel Functions)
- **Database**: Supabase (PostgreSQL + Auth + Realtime) - Free tier
- **AI**: OpenRouter.ai API (access to multiple models) - $10-20/month
- **State Management**: React hooks (useState, useEffect)
- **UI Components**: shadcn/ui
- **Hosting**: Vercel (free tier)
- **PWA**: Next.js PWA plugin

## Database Schema (Simplified)

### Core Tables
```sql
-- Sessions (anonymous users)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Travelers (multiple per session)
CREATE TABLE travelers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER CHECK (age >= 1 AND age <= 120) NOT NULL,
  mobility TEXT CHECK (mobility IN ('high', 'medium', 'low')) DEFAULT 'high',
  relationship TEXT, -- parent, child, grandparent, spouse, friend
  interests TEXT[], -- for children: animals, playgrounds, museums
  cultural_background TEXT, -- indian, chinese, middle_eastern, western, other
  dietary_restrictions TEXT[], -- vegetarian, vegan, halal, kosher, gluten_free
  created_at TIMESTAMP DEFAULT NOW()
);

-- Trips (saved conversations)
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  destination TEXT,
  traveler_ids UUID[], -- array of traveler IDs for this trip
  conversation JSONB NOT NULL,
  metadata JSONB DEFAULT '{}', -- for future extensions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Basic indexes for performance
CREATE INDEX idx_travelers_session ON travelers(session_id);
CREATE INDEX idx_trips_session ON trips(session_id);
CREATE INDEX idx_trips_created ON trips(created_at DESC);
CREATE INDEX idx_sessions_last_active ON sessions(last_active);
```

## Core Features Implementation

### 1. Q&A Guided Onboarding Flow
**Path**: `/onboarding`

**Components Structure**:
```typescript
// components/onboarding/OnboardingWizard.tsx
interface OnboardingStep {
  id: string;
  question: string;
  type: 'number' | 'text' | 'select' | 'multiselect' | 'age-specific';
  options?: string[];
  validation: (value: any) => boolean;
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'traveler_count',
    question: 'How many people are traveling together?',
    type: 'number',
    validation: (val) => val >= 1 && val <= 8
  },
  // Dynamic steps based on traveler count
  {
    id: 'traveler_1_name',
    question: 'What\'s the first person\'s name?',
    type: 'text',
    validation: (val) => val.length > 0
  },
  {
    id: 'traveler_1_age',
    question: 'How old is {name}?',
    type: 'number',
    validation: (val) => val >= 1 && val <= 120
  },
  {
    id: 'traveler_1_relationship',
    question: 'What\'s {name}\'s relationship to you?',
    type: 'select',
    options: ['myself', 'spouse', 'child', 'parent', 'grandparent', 'grandchild', 'sibling', 'friend']
  },
  // Age-specific follow-up questions
  {
    id: 'traveler_1_mobility', // Show only for age 50+
    question: 'Does {name} have any mobility considerations?',
    type: 'select',
    options: ['high_mobility', 'moderate_walking', 'limited_walking', 'wheelchair_accessible']
  },
  {
    id: 'traveler_1_interests', // Show only for age 5-16
    question: 'What does {name} enjoy? (Select all that apply)',
    type: 'multiselect',
    options: ['animals', 'playgrounds', 'museums', 'sports', 'art', 'music', 'nature', 'science']
  },
  {
    id: 'cultural_background',
    question: 'Any cultural or dietary preferences for the group?',
    type: 'multiselect',
    options: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'indian_cuisine', 'chinese_cuisine', 'mediterranean']
  }
];
```

**Implementation Steps**:
- Create dynamic form that adapts questions based on previous answers
- Show age-specific questions (mobility for 50+, interests for kids)
- Store answers in React state during onboarding
- Save completed profile to Supabase
- Redirect to chat interface with context

### 2. OpenRouter.ai Integration
**Service**: `lib/ai/openrouter.ts`

```typescript
// lib/ai/openrouter.ts
export class OpenRouterAI {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY!;
  }

  async generateResponse(messages: Message[], travelers: Traveler[]) {
    const prompt = this.buildAgeAwarePrompt(travelers, messages);
    
    try {
      // Primary model: Claude 3.5 Sonnet (cost-effective)
      const response = await this.callModel('anthropic/claude-3.5-sonnet', prompt);
      return response;
    } catch (error) {
      // Fallback to GPT-4o mini (cheaper backup)
      console.warn('Claude failed, falling back to GPT-4o mini');
      return await this.callModel('openai/gpt-4o-mini', prompt);
    }
  }

  private buildAgeAwarePrompt(travelers: Traveler[], messages: Message[]) {
    const travelerContext = travelers.map(t => ({
      name: t.name,
      age: t.age,
      mobility: t.mobility,
      interests: t.interests,
      cultural: t.cultural_background,
      dietary: t.dietary_restrictions
    }));

    return {
      system: `You are FlexiTrip, an AI travel assistant specializing in multi-generational family travel.

CURRENT TRAVELERS: ${JSON.stringify(travelerContext, null, 2)}

KEY CONSIDERATIONS:
${this.generateAgeSpecificGuidelines(travelers)}

CULTURAL & DIETARY:
${this.generateCulturalGuidelines(travelers)}

Provide specific, actionable recommendations that work for ALL travelers. Always explain why each suggestion fits the group's needs.`,
      messages: messages
    };
  }

  private generateAgeSpecificGuidelines(travelers: Traveler[]): string {
    return travelers.map(t => {
      if (t.age <= 5) return `• ${t.name} (${t.age}): Needs stroller-friendly paths, frequent breaks, simple activities, safety priority`;
      if (t.age <= 12) return `• ${t.name} (${t.age}): Needs interactive activities, shorter attention spans, playground access, kid-friendly food`;
      if (t.age <= 17) return `• ${t.name} (${t.age}): Enjoys social activities, photo opportunities, some independence, diverse food`;
      if (t.age >= 65) return `• ${t.name} (${t.age}): May need accessible venues, seating areas, shorter walking distances, comfortable transport`;
      return `• ${t.name} (${t.age}): Can handle most activities, good for group coordination`;
    }).join('\n');
  }
}
```

### 3. Age-Aware Chat Interface
**Path**: `/chat`

**Components**:
```typescript
// components/chat/ChatInterface.tsx
export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [travelers, setTravelers] = useState<Traveler[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    const userMessage = { role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          travelers: travelers,
          sessionId: sessionStorage.getItem('sessionId')
        })
      });

      const reader = response.body?.getReader();
      let assistantMessage = { role: 'assistant', content: '', timestamp: new Date() };
      
      // Handle streaming response
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = new TextDecoder().decode(value);
        assistantMessage.content += chunk;
        setMessages(prev => [...prev.slice(0, -1), assistantMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      {/* Traveler Context Bar */}
      <TravelerContextBar travelers={travelers} />
      
      {/* Messages */}
      <MessageList messages={messages} />
      
      {/* Input */}
      <MessageInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
```

### 4. Progressive Web App Setup
**File**: `next.config.js`

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withPWA({
  experimental: {
    appDir: true
  }
});
```

**File**: `public/manifest.json`
```json
{
  "name": "FlexiTrip - Family Travel Planning",
  "short_name": "FlexiTrip",
  "description": "AI-powered travel planning for multi-generational families",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## API Design

### Core Endpoints

#### 1. Session Management
```typescript
// app/api/session/route.ts
export async function GET() {
  const sessionId = cookies().get('sessionId')?.value || uuidv4();
  
  // Create or update session
  const { error } = await supabase
    .from('sessions')
    .upsert({ 
      id: sessionId, 
      last_active: new Date().toISOString() 
    });

  const response = NextResponse.json({ sessionId });
  response.cookies.set('sessionId', sessionId, {
    maxAge: 30 * 24 * 60 * 60, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  return response;
}
```

#### 2. Travelers CRUD
```typescript
// app/api/travelers/route.ts
export async function POST(request: Request) {
  const { sessionId, name, age, mobility, relationship, interests, cultural_background, dietary_restrictions } = await request.json();

  const { data, error } = await supabase
    .from('travelers')
    .insert({
      session_id: sessionId,
      name,
      age,
      mobility,
      relationship,
      interests,
      cultural_background,
      dietary_restrictions
    })
    .select()
    .single();

  return NextResponse.json({ traveler: data });
}
```

#### 3. AI Chat with Streaming
```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { messages, travelers, sessionId } = await request.json();

  const openrouter = new OpenRouterAI();
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await openrouter.generateStreamingResponse(messages, travelers);
        
        for await (const chunk of response) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked'
    }
  });
}
```

## Performance Optimizations

### 1. Client-Side Caching
```typescript
// lib/cache/sessionCache.ts
class SessionCache {
  private cache = new Map();

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key: string, data: any, ttlMinutes = 30) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + (ttlMinutes * 60 * 1000)
    });
  }
}
```

### 2. Component Optimization
```typescript
// Lazy loading for non-critical components
const TripHistory = lazy(() => import('../components/TripHistory'));
const TravelerSettings = lazy(() => import('../components/TravelerSettings'));

// Memoization for expensive computations
const MemoizedTravelerCard = memo(({ traveler }: { traveler: Traveler }) => {
  const ageCategory = useMemo(() => {
    if (traveler.age <= 12) return 'child';
    if (traveler.age >= 65) return 'senior';
    return 'adult';
  }, [traveler.age]);

  return <TravelerCard traveler={traveler} category={ageCategory} />;
});
```

### 3. Database Query Optimization
```sql
-- Efficient queries for common operations
CREATE OR REPLACE FUNCTION get_session_with_travelers(session_uuid UUID)
RETURNS TABLE (
  session_id UUID,
  session_created_at TIMESTAMP,
  traveler_id UUID,
  traveler_name TEXT,
  traveler_age INTEGER,
  traveler_mobility TEXT,
  traveler_relationship TEXT,
  traveler_interests TEXT[],
  cultural_background TEXT,
  dietary_restrictions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.created_at,
    t.id,
    t.name,
    t.age,
    t.mobility,
    t.relationship,
    t.interests,
    t.cultural_background,
    t.dietary_restrictions
  FROM sessions s
  LEFT JOIN travelers t ON s.id = t.session_id
  WHERE s.id = session_uuid;
END;
$$ LANGUAGE plpgsql;
```

## Security Implementation

### 1. Input Validation
```typescript
// lib/validation/schemas.ts
import { z } from 'zod';

export const TravelerSchema = z.object({
  name: z.string().min(1).max(50),
  age: z.number().int().min(1).max(120),
  mobility: z.enum(['high', 'medium', 'low']),
  relationship: z.string().optional(),
  interests: z.array(z.string()).max(10).optional(),
  cultural_background: z.string().optional(),
  dietary_restrictions: z.array(z.string()).max(10).optional()
});

export const ChatMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  travelers: z.array(TravelerSchema).min(1).max(8),
  sessionId: z.string().uuid()
});
```

### 2. Rate Limiting
```typescript
// lib/rateLimiting.ts
const rateLimitMap = new Map();

export function rateLimit(identifier: string, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  const recentRequests = requests.filter((time: number) => time > windowStart);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}
```

## Development Workflow (6 Weeks)

### Week 1: Foundation
- [x] Next.js 14 project setup with TypeScript
- [x] Supabase project and database schema
- [x] OpenRouter.ai API integration
- [x] Basic session management
- [x] Environment configuration

### Week 2: Q&A Onboarding
- [x] Dynamic onboarding wizard component
- [x] Age-specific question logic
- [x] Travelers CRUD API
- [x] Form validation and error handling

### Week 3: Chat Interface
- [x] Real-time chat UI with streaming
- [x] Age-aware AI prompt engineering
- [x] Message persistence
- [x] Traveler context integration

### Week 4: Trip Management
- [x] Trip saving and retrieval
- [x] Trip list interface
- [x] Conversation history display
- [x] Basic trip metadata

### Week 5: PWA & Polish
- [x] PWA configuration and icons
- [x] Responsive design optimization
- [x] Accessibility improvements
- [x] Performance optimization

### Week 6: Testing & Launch
- [x] Cross-browser testing
- [x] Mobile device testing
- [x] Beta user feedback
- [x] Production deployment

## Cost Management

### Monthly Cost Breakdown
- **Vercel**: $0 (free tier, <100GB bandwidth)
- **Supabase**: $0 (free tier, <500MB database)
- **OpenRouter.ai**: $15-25 (based on usage)
- **Domain**: $1/month
- **Total**: $16-26/month

### Cost Optimization Strategies
```typescript
// Smart model selection based on complexity
function selectModel(messageLength: number, travelerCount: number) {
  if (messageLength < 500 && travelerCount <= 2) {
    return 'openai/gpt-4o-mini'; // Cheaper for simple queries
  }
  return 'anthropic/claude-3.5-sonnet'; // Better for complex multi-gen planning
}

// Implement request caching
const requestCache = new Map();
function getCachedResponse(key: string) {
  const cached = requestCache.get(key);
  if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
    return cached.response;
  }
  return null;
}
```

## Monitoring & Analytics

### Basic Analytics
```typescript
// lib/analytics.ts
export function trackEvent(event: string, properties: Record<string, any>) {
  if (typeof window !== 'undefined') {
    // Use Vercel Analytics (free)
    (window as any).va?.track(event, properties);
  }
}

// Track key events
trackEvent('onboarding_completed', { traveler_count: travelers.length });
trackEvent('trip_planned', { destination, traveler_ages: travelers.map(t => t.age) });
trackEvent('ai_response_generated', { model_used, response_time });
```

## Deployment Guide

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key
NEXT_PUBLIC_APP_URL=https://flexitrip.vercel.app
```

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Set build command: `npm run build`
4. Deploy and test

### Database Migration
```sql
-- Run in Supabase SQL editor
\i schema.sql

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (open for MVP, restrict later)
CREATE POLICY "Sessions are publicly readable" ON sessions FOR SELECT USING (true);
CREATE POLICY "Sessions are publicly writable" ON sessions FOR INSERT WITH CHECK (true);
```

## Success Metrics

### Technical KPIs
- Page load time: <3 seconds
- Chat response time: <2 seconds to start streaming
- Uptime: >99% availability
- Error rate: <1% of requests

### Business KPIs
- Onboarding completion: >80%
- Multi-generational trips: >40% of total
- User retention: >30% return within 7 days
- Cost per user: <$2/month

This implementation guide provides a complete roadmap for building FlexiTrip as a cost-effective, feature-rich multi-generational travel planning application.