export interface AnalysisResult {
  isGenerated: boolean;
  confidence: number;
  segments: {
    timestamp?: string;
    description: string;
    likelihood: 'low' | 'medium' | 'high';
    anomalyType: 'visual' | 'audio' | 'context' | 'deepfake-overlay';
  }[];
  originalSourceEstimate?: string;
  safetyConcerns: string[];
  summary: string;
}

export interface ClaimVerification {
  claim: string;
  verdict: 'true' | 'false' | 'misleading' | 'unverified' | 'partially-true';
  explanation: string;
  confidence: number;
  sources: { title: string; uri: string }[];
}

export interface FactCheckResult {
  overallCredibility: number;
  summary: string;
  claims: ClaimVerification[];
  biasAnalysis: {
    label: string;
    intensity: 'low' | 'medium' | 'high';
    description: string;
  };
  logicalFallacies: string[];
}

export interface ScriptSource {
  textSnippet: string;
  sourceTitle: string;
  author: string;
  uri: string;
  type: 'verbatim' | 'paraphrased' | 'derivative';
  similarity: number;
}

export interface ScriptOriginResult {
  originalityScore: number; // 0-100
  isOriginal: boolean;
  attributionSummary: string;
  matchedSources: ScriptSource[];
  literaryContext: string;
}

export interface TrustAnalysisResult {
  trustScore: number; // 0-100
  verdict: 'SAFE' | 'CAUTION' | 'SCAM' | 'UNKNOWN';
  summary: string;
  riskFactors: string[];
  trustSignals: string[];
  businessDetails?: {
    name: string;
    ageEstimate: string;
    location: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  sources?: {
    uri: string;
    title: string;
  }[];
}

export enum AnalysisMode {
  FAST = 'FAST',
  DEEP = 'DEEP'
}

export interface LiveConnectionState {
  isConnected: boolean;
  isSpeaking: boolean;
  error: string | null;
}
