# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FlexiTrip is a Progressive Web App (PWA) for multi-generational travel planning that uses AI to generate age-appropriate recommendations. The application specializes in creating travel plans that work for families with diverse age groups (from toddlers to grandparents).

## Technology Stack

**Frontend:**
- Next.js 14 with App Router and TypeScript
- Tailwind CSS for styling
- shadcn/ui component library
- React hooks for state management

**Backend:**
- Next.js API Routes (Vercel Functions)
- PostgreSQL via Supabase (free tier)
- OpenRouter.ai for multi-model AI access (Claude 3.5 Sonnet primary, GPT-4o mini fallback)

**Infrastructure:**
- Hosting: Vercel (free tier)
- Database: Supabase PostgreSQL with Row Level Security
- PWA: next-pwa plugin for offline capabilities

## Architecture

The application follows a cost-optimized architecture designed for a solo developer:

### Database Schema
Three core tables:
- `sessions` - Anonymous user sessions (UUID-based)
- `travelers` - Family member profiles with age-specific attributes
- `trips` - Saved conversations with metadata and traveler associations

Key relationships:
- Sessions (1) → Many (Travelers)
- Sessions (1) → Many (Trips) 
- Trips reference travelers via UUID arrays

### Core Features
1. **Q&A Guided Onboarding** - Dynamic questionnaire that adapts based on family composition
2. **Age-Aware AI Chat** - Context-aware recommendations considering all traveler ages, mobility, cultural background, and dietary restrictions
3. **Trip Management** - Save and continue travel planning conversations
4. **PWA Features** - Offline access and mobile app experience

## AI Implementation

The AI system uses OpenRouter.ai to access multiple models with intelligent selection:
- Primary: Claude 3.5 Sonnet for complex multi-generational planning
- Fallback: GPT-4o mini for simpler queries and cost optimization

Key AI considerations:
- Age-specific guidelines (children need safety/interactivity, seniors need accessibility)
- Cultural and dietary preference integration
- Mobility considerations for recommendations
- Multi-generational activity suggestions that work for all age groups

## Development Notes

**Cost Optimization Priority:**
- Target operational costs: $20-50/month
- Free tier usage for Vercel and Supabase
- Smart AI model selection based on query complexity
- Client-side caching to reduce API calls

**Security:**
- Anonymous sessions (no email/phone required)
- Input validation with Zod schemas
- Rate limiting (5 chat requests per minute)
- SQL injection prevention through parameterized queries
- 30-day automatic session cleanup

**Performance Requirements:**
- Initial page load: <3 seconds on 3G
- Chat response streaming: <1 second to start
- Database queries: <500ms (95th percentile)
- Mobile PageSpeed Insights: >85

## Accessibility Requirements

Universal design for ages 5-95:
- Font size: Minimum 18px, scalable to 200%
- Touch targets: Minimum 44x44px
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility

## Current Project Status

This is a planning phase project with comprehensive documentation but no implemented code yet. The repository contains:
- `flexitrip-requirements-final.md` - Complete functional and non-functional requirements
- `technical-plan-final.md` - Detailed technical architecture
- `coding-implementation-guide-final.md` - Step-by-step implementation guide

The project is designed for a 6-week development timeline targeting launch-ready MVP with self-sustaining operation within budget constraints.