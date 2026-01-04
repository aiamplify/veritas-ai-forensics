import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Analysis = {
  id: string;
  user_id: string;
  type: 'video' | 'image' | 'fact-check' | 'script' | 'trust';
  input: string;
  title: string | null;
  result: Record<string, unknown>;
  created_at: string;
};

export type Usage = {
  id: string;
  user_id: string;
  date: string;
  analysis_count: number;
};
