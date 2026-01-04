# Veritas AI - Blueprint

> **Status**: Awaiting Approval
> **Phase**: B — Blueprint
> **Source**: Google AI Studio Export

---

## Product Overview

**Veritas AI** is an AI-powered forensics and fact-checking platform that helps users detect deepfakes, verify claims, identify plagiarism, and assess website trustworthiness using Google's Gemini API.

### Target Users

| Persona | Use Case |
|---------|----------|
| **Journalists** | Verify sources, detect manipulated media before publishing |
| **Researchers** | Authenticate documents, check script origins |
| **Content Creators** | Ensure originality, avoid plagiarism |
| **General Public** | Spot scams, verify viral content, fact-check claims |
| **Security Teams** | Assess website legitimacy, detect phishing |

### Core Value Proposition

- Real-time AI-powered media forensics
- Multi-source fact verification with citations
- Scam/trust detection for URLs and products
- Voice-enabled AI assistant for hands-free analysis

---

## Feature Set

### Existing Features (from Google AI Studio)

| Feature | Description | Status |
|---------|-------------|--------|
| **Video Forensics** | Analyze YouTube videos for AI generation/deepfakes | UI Complete |
| **Image Analysis** | Detect AI artifacts in uploaded images | UI Complete |
| **Fact-Checking** | Verify claims via URL or text input | UI Complete |
| **Script Origin** | Detect plagiarism in YouTube video scripts | UI Complete |
| **Trust Analysis** | Scam detection for websites/products | UI Complete |
| **Live Voice Agent** | Real-time voice interaction with Gemini | UI Complete |
| **Chat Interface** | Context-aware AI assistant sidebar | UI Complete |

### Features to Build (MVP)

| Feature | Description | Priority |
|---------|-------------|----------|
| **User Authentication** | Supabase Auth with Google OAuth | P0 |
| **User Profiles** | Store preferences, view history | P0 |
| **Analysis History** | Save and revisit past analyses | P1 |
| **Rate Limiting** | Prevent API abuse (free tier limits) | P1 |
| **Server-Side API** | Protect Gemini API key | P0 |
| **Error Handling** | Graceful failures, user feedback | P1 |
| **Mobile Responsiveness** | Full mobile support | P1 |
| **Share Results** | Generate shareable analysis links | P2 |

---

## Tech Stack

### Current (from Google AI Studio)

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript |
| Build | Vite 6 |
| AI | Google Gemini API (@google/genai) |
| Styling | Tailwind CSS (inline classes) |

### To Add

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Auth | Supabase Auth | Free tier, Google OAuth built-in |
| Database | Supabase PostgreSQL | Same platform, RLS for security |
| Backend | Vercel Serverless Functions | Co-located with frontend, free tier |
| Hosting | Vercel | Best for Vite/React, automatic CI/CD |
| Analytics | Vercel Analytics | Built-in, no extra setup |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel                                │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │   React App     │     │   Serverless Functions      │   │
│  │   (Frontend)    │────▶│   /api/analyze              │   │
│  │                 │     │   /api/fact-check           │   │
│  │   - Auth UI     │     │   /api/trust-check          │   │
│  │   - Dashboards  │     │   /api/script-origin        │   │
│  │   - Voice Agent │     │   /api/chat                 │   │
│  └─────────────────┘     └──────────┬──────────────────┘   │
│                                      │                      │
└──────────────────────────────────────┼──────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │   Supabase   │   │  Gemini API  │   │Google Search │
            │   - Auth     │   │  - Analysis  │   │  - Grounding │
            │   - Database │   │  - Chat      │   │              │
            │   - RLS      │   │  - Voice     │   │              │
            └──────────────┘   └──────────────┘   └──────────────┘
```

---

## Database Schema (Supabase)

### Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis History
CREATE TABLE public.analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'video', 'image', 'fact-check', 'script', 'trust'
  input TEXT NOT NULL, -- URL or text input
  result JSONB NOT NULL, -- Full analysis result
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking (for future rate limiting)
CREATE TABLE public.usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  analysis_count INT DEFAULT 0,
  UNIQUE(user_id, date)
);
```

### Row Level Security

```sql
-- Profiles: Users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Analyses: Users can only access their own analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON public.analyses FOR DELETE USING (auth.uid() = user_id);

-- Usage: Users can only view their own usage
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON public.usage FOR SELECT USING (auth.uid() = user_id);
```

---

## API Endpoints (Vercel Serverless)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Video/image forensics analysis |
| `/api/fact-check` | POST | Fact-check URL or text |
| `/api/script-origin` | POST | Check script plagiarism |
| `/api/trust-check` | POST | Website/product trust analysis |
| `/api/chat` | POST | Chat with context |
| `/api/history` | GET | Get user's analysis history |
| `/api/history/[id]` | DELETE | Delete an analysis |

All endpoints require authentication via Supabase JWT.

---

## Monetization

**Current**: Free (no payments)

**Future-Ready Structure**:
- Usage tracking table in place
- Rate limiting middleware ready to add
- Stripe integration can be added later without major refactoring

---

## Services Required

| Service | Purpose | Account Needed |
|---------|---------|----------------|
| **Supabase** | Auth + Database | Yes (free tier) |
| **Vercel** | Hosting + Functions | Yes (free tier) |
| **Google Cloud** | Gemini API | Already configured |

### MCP Status

| MCP | Status | Action |
|-----|--------|--------|
| GitHub MCP | Configured | Ready |
| Supabase MCP | Not configured | Need to set up |

---

## Implementation Plan

### Phase R — Ready (Setup)

1. Create Supabase project
2. Set up database schema and RLS policies
3. Configure Supabase Auth with Google OAuth
4. Initialize Vercel project
5. Set up environment variables
6. Create GitHub repository

### Phase I — Implement (Build)

1. **Backend First**
   - Create serverless API endpoints
   - Move Gemini calls to server-side
   - Add Supabase client for auth verification

2. **Auth Integration**
   - Add Supabase Auth to React app
   - Create login/signup UI
   - Protected routes for authenticated users

3. **Database Integration**
   - Save analyses to history
   - Display history in UI
   - Add delete functionality

4. **Polish**
   - Error boundaries and handling
   - Loading states
   - Mobile responsiveness audit
   - Accessibility check

### Phase D — Deploy

1. Connect GitHub repo to Vercel
2. Configure environment variables in Vercel
3. Deploy to production
4. Verify all features work in production

### Phase G — Grow

1. Enable Vercel Analytics
2. Set up error monitoring
3. Add feedback collection widget

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini (server-side only)
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Gemini API costs | Usage tracking, rate limiting ready to add |
| API key exposure | Move all Gemini calls to serverless functions |
| Supabase free tier limits | Monitor usage, upgrade path clear |
| Voice API browser support | Graceful fallback to text chat |

---

## Success Criteria

- [ ] Users can sign in with Google
- [ ] All 5 analysis types work end-to-end
- [ ] Analyses are saved to history
- [ ] App is fully responsive on mobile
- [ ] Deployed and accessible at production URL
- [ ] No client-side API key exposure

---

## Approval

**Please confirm this Blueprint to proceed with Phase R (Ready).**

Changes can be made at any milestone. This document will be updated as we progress.
