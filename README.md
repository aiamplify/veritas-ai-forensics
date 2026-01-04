# Veritas AI - Forensics & Fact-Checking

AI-powered platform for detecting deepfakes, verifying claims, and analyzing trust using Google's Gemini API.

## Features

- **Video Forensics** - Detect AI-generated content and deepfakes in YouTube videos
- **Image Analysis** - Identify AI artifacts in uploaded images
- **Fact-Checking** - Verify claims with real-time Google Search integration
- **Script Origin** - Detect plagiarism and attribution in video scripts
- **Trust Analysis** - Scam detection for websites and products
- **Live Voice Agent** - Real-time voice interaction with the AI
- **Chat Interface** - Context-aware AI assistant

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase PostgreSQL
- **AI**: Google Gemini API
- **Deployment**: Vercel (frontend + serverless functions)

## Local Development

### Prerequisites

- Node.js 18+
- Supabase account
- Google Cloud account with Gemini API access

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/aiamplify/veritas-ai-forensics.git
   cd veritas-ai-forensics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from example:
   ```bash
   cp .env.example .env.local
   ```

4. Fill in your environment variables:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:3000

## Database Setup

Run the SQL migration in your Supabase SQL editor:
- File: `supabase/migrations/001_initial_schema.sql`

This creates:
- `profiles` table (extends auth.users)
- `analyses` table (stores analysis history)
- `usage` table (for rate limiting)
- Auto-profile creation trigger
- Row-level security policies

## Deployment

### Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new)
2. Add environment variables:
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy

### Google OAuth Setup

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized origins and redirect URIs
3. Configure Google provider in [Supabase Auth settings](https://supabase.com/dashboard/project/_/auth/providers)

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analyze` | POST | Video/image forensics analysis |
| `/api/fact-check` | POST | Fact-check URL or text |
| `/api/script-origin` | POST | Check script plagiarism |
| `/api/trust-check` | POST | Website/product trust analysis |
| `/api/chat` | POST | Chat with context |

## License

MIT
