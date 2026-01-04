import { GoogleGenAI, Type, Schema, LiveServerMessage, Modality } from "@google/genai";
import { AnalysisResult, AnalysisMode, FactCheckResult, ScriptOriginResult, TrustAnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Schemas ---

const trustAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    trustScore: { type: Type.NUMBER, description: "0-100 score. 0 is a definite scam, 100 is highly trusted." },
    verdict: { type: Type.STRING, enum: ['SAFE', 'CAUTION', 'SCAM', 'UNKNOWN'] },
    summary: { type: Type.STRING, description: "Comprehensive analysis of why the site is trusted or not." },
    riskFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Red flags (e.g., hidden whois, bad reviews)." },
    trustSignals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Green flags (e.g., clear contact info, reputable history)." },
    businessDetails: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        ageEstimate: { type: Type.STRING },
        location: { type: Type.STRING }
      }
    }
  },
  required: ["trustScore", "verdict", "summary", "riskFactors", "trustSignals"]
};

const scriptOriginSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalityScore: { type: Type.NUMBER, description: "0-100 score where 100 is completely original." },
    isOriginal: { type: Type.BOOLEAN },
    attributionSummary: { type: Type.STRING },
    matchedSources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          textSnippet: { type: Type.STRING },
          sourceTitle: { type: Type.STRING },
          author: { type: Type.STRING },
          uri: { type: Type.STRING },
          type: { type: Type.STRING, enum: ['verbatim', 'paraphrased', 'derivative'] },
          similarity: { type: Type.NUMBER }
        }
      }
    },
    literaryContext: { type: Type.STRING }
  },
  required: ["originalityScore", "isOriginal", "attributionSummary", "matchedSources"]
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isGenerated: { type: Type.BOOLEAN },
    confidence: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Start time of the segment (e.g., 00:15)" },
          description: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          anomalyType: { type: Type.STRING, enum: ['visual', 'audio', 'context', 'deepfake-overlay'] }
        }
      }
    },
    originalSourceEstimate: { type: Type.STRING },
    safetyConcerns: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["isGenerated", "confidence", "summary", "segments"]
};

const factCheckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallCredibility: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    claims: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING },
          verdict: { type: Type.STRING, enum: ['true', 'false', 'misleading', 'unverified', 'partially-true'] },
          explanation: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          sources: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, uri: { type: Type.STRING } } }
          }
        }
      }
    },
    biasAnalysis: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING },
        intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        description: { type: Type.STRING }
      }
    },
    logicalFallacies: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["overallCredibility", "summary", "claims", "biasAnalysis", "logicalFallacies"]
};

// --- API Methods ---

export const analyzeMedia = async (input: string, inputType: 'url' | 'image', mode: AnalysisMode): Promise<AnalysisResult> => {
  const modelName = mode === AnalysisMode.DEEP ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview'; 
  const config: any = { responseMimeType: "application/json", responseSchema: analysisSchema };
  if (mode === AnalysisMode.DEEP) config.thinkingConfig = { thinkingBudget: 32768 };
  
  let contents: any;
  if (inputType === 'url') {
    // UPDATED PROMPT: Explicit instruction to ignore ads
    contents = { 
      parts: [{ 
        text: `Analyze this URL for AI generation or deepfakes: ${input}. 
        CRITICAL INSTRUCTION: You MUST ignore any advertisements, pre-roll ads, or mid-roll commercials. 
        Focus strictly on the main content produced by the channel owner/creator. 
        Do not flag the video as AI-generated if the ad is AI-generated. Analyze the video itself.
        Provide a detailed breakdown of segments with timestamps where anomalies are detected.` 
      }] 
    };
    config.tools = [{ googleSearch: {} }];
  } else {
    contents = { parts: [{ inlineData: { mimeType: 'image/jpeg', data: input } }, { text: "Detect AI artifacts. Provide a confidence score and segment specific areas of the image if possible (use 'General' for timestamp)." }] };
  }
  
  const response = await ai.models.generateContent({ model: modelName, contents, config });
  return JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
};

export const authenticateInformation = async (input: string, inputType: 'url' | 'text'): Promise<FactCheckResult> => {
  const modelName = 'gemini-3-pro-preview';
  const config: any = { responseMimeType: "application/json", responseSchema: factCheckSchema, tools: [{ googleSearch: {} }] };
  
  // UPDATED PROMPT: Explicit instruction to ignore ads
  const prompt = inputType === 'url' 
    ? `Fact-check the claims in the MAIN CONTENT of this video URL: ${input}. 
       IMPORTANT: Ignore all advertisements and sponsored segments. Verify only the claims made by the content creator.` 
    : `Verify these claims: ${input}`;
    
  const response = await ai.models.generateContent({ model: modelName, contents: { parts: [{ text: prompt }] }, config });
  return JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
};

export const checkScriptOrigin = async (url: string, videoTitle?: string, channelName?: string): Promise<ScriptOriginResult> => {
  const modelName = 'gemini-3-pro-preview';
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: scriptOriginSchema,
    tools: [{ googleSearch: {} }]
  };

  let prompt = `Identify the origin of the script or spoken text in the MAIN VIDEO CONTENT at this URL: ${url}.\n`;
  
  if (videoTitle) {
    prompt += `Video Title: "${videoTitle}"\n`;
  }
  if (channelName) {
    prompt += `Channel Name: "${channelName}"\n`;
  }

  prompt += `
  CRITICAL: Ignore any ads, commercials, or sponsored readings. Focus on the narrative spoken by the main creator.
  Specifically check if the words used are taken from books, articles, historical speeches, or other authors. 
  Provide specific citations including author names, book titles, and URLs if available.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ text: prompt }] },
    config
  });

  return JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
};

export const analyzeTrust = async (url: string): Promise<TrustAnalysisResult> => {
  const modelName = 'gemini-3-pro-preview';
  const config: any = {
    responseMimeType: "application/json",
    responseSchema: trustAnalysisSchema,
    tools: [{ googleSearch: {} }]
  };

  const prompt = `Conduct a rigorous trust and safety audit of this URL: ${url}. 
  Determine if this is a legitimate product/service or a potential scam.
  1. Search for user reviews, complaints (BBB, TrustPilot, Reddit), and scam reports.
  2. Analyze the domain age and business transparency.
  3. Look for red flags like unrealistic prices, poor grammar, hidden contact info, or pressure tactics.
  4. Provide a 'Trust Score' (0-100) and a Verdict (SAFE, CAUTION, SCAM).
  
  If it is a product page, check if it's a cheap dropshipping item sold at a markup.`;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts: [{ text: prompt }] },
    config
  });

  return JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
};

export const sendChatMessage = async (history: { role: 'user' | 'model'; text: string }[], currentMessage: string, context?: string) => {
  const systemInstruction = `You are Veritas Assistant. Expert in AI forensics, fact-checking, and scam detection. Context: ${context || "None"}`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })), { role: 'user', parts: [{ text: currentMessage }] }],
    config: { systemInstruction, tools: [{ googleSearch: {} }] }
  });
  return { text: response.text, groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks };
};

// --- Live API Stubs ---
export const connectLiveAgent = async (onAudioData: (buffer: ArrayBuffer) => void, onClose: () => void) => {
  return ai.live.connect({ 
    model: 'gemini-2.5-flash-native-audio-preview-09-2025', 
    config: { 
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are Veritas, an elite AI forensics and fact-checking voice assistant. Your goal is to help users authenticate information, detect deepfakes, and verify sources in real-time. Use the Google Search tool to verify specific claims the user asks about.",
      tools: [{ googleSearch: {} }]
    }, 
    callbacks: { 
      onmessage: (msg: LiveServerMessage) => { 
        const d = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data; 
        if (d) onAudioData(new Uint8Array(atob(d).split("").map(c => c.charCodeAt(0))).buffer); 
      }, 
      onclose: onClose 
    } 
  });
};
export const createPCM16Blob = (inputData: Float32Array) => ({ data: "", mimeType: 'audio/pcm;rate=16000' });
