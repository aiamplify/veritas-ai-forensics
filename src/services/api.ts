import { supabase } from '../lib/supabase';
import { AnalysisResult, AnalysisMode, FactCheckResult, ScriptOriginResult, TrustAnalysisResult } from '../types';

const API_BASE = '/api';

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {}),
  };
}

async function apiRequest<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
}

export const analyzeMedia = async (
  input: string,
  inputType: 'url' | 'image',
  mode: AnalysisMode
): Promise<AnalysisResult> => {
  return apiRequest<AnalysisResult>('/analyze', { input, inputType, mode });
};

export const authenticateInformation = async (
  input: string,
  inputType: 'url' | 'text'
): Promise<FactCheckResult> => {
  return apiRequest<FactCheckResult>('/fact-check', { input, inputType });
};

export const checkScriptOrigin = async (
  url: string,
  videoTitle?: string,
  channelName?: string
): Promise<ScriptOriginResult> => {
  return apiRequest<ScriptOriginResult>('/script-origin', { url, videoTitle, channelName });
};

export const analyzeTrust = async (url: string): Promise<TrustAnalysisResult> => {
  return apiRequest<TrustAnalysisResult>('/trust-check', { url });
};

export const sendChatMessage = async (
  history: { role: 'user' | 'model'; text: string }[],
  currentMessage: string,
  context?: string
): Promise<{ text: string; groundingChunks?: Array<{ web?: { uri: string; title: string } }> }> => {
  return apiRequest('/chat', { history, currentMessage, context });
};

// History functions
export const saveAnalysis = async (
  type: string,
  input: string,
  result: Record<string, unknown>,
  title?: string
): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { error } = await supabase.from('analyses').insert({
    user_id: session.user.id,
    type,
    input,
    result,
    title,
  });

  if (error) {
    console.error('Error saving analysis:', error);
  }
};

export const getAnalysisHistory = async (limit = 50): Promise<Array<{
  id: string;
  type: string;
  input: string;
  title: string | null;
  result: Record<string, unknown>;
  created_at: string;
}>> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return [];

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  return data || [];
};

export const deleteAnalysis = async (id: string): Promise<void> => {
  const { error } = await supabase.from('analyses').delete().eq('id', id);
  if (error) {
    console.error('Error deleting analysis:', error);
    throw error;
  }
};
