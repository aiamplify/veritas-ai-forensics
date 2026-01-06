import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isGenerated: { type: Type.BOOLEAN, description: "True if AI-generated content detected" },
    confidence: { type: Type.NUMBER, description: "0-100 confidence score" },
    summary: { type: Type.STRING, description: "Comprehensive multi-paragraph analysis explaining findings in detail" },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Specific timestamp (e.g., 00:15, 02:30) or 'General'" },
          description: { type: Type.STRING, description: "Detailed description of the anomaly or finding" },
          likelihood: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          anomalyType: { type: Type.STRING, enum: ['visual', 'audio', 'context', 'deepfake-overlay'] },
          directQuote: { type: Type.STRING, description: "Direct quote from video/content if applicable" },
          evidenceDetails: { type: Type.STRING, description: "Specific technical evidence supporting this finding" }
        },
        required: ["timestamp", "description", "likelihood", "anomalyType"]
      }
    },
    technicalIndicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          indicator: { type: Type.STRING, description: "Name of technical indicator (e.g., 'Audio Waveform Analysis', 'Facial Landmark Consistency')" },
          finding: { type: Type.STRING, description: "What was found" },
          significance: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] }
        }
      }
    },
    audioAnalysis: {
      type: Type.OBJECT,
      properties: {
        voiceAuthenticity: { type: Type.STRING, description: "Analysis of voice patterns - natural vs synthetic" },
        audioArtifacts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of audio anomalies detected" },
        likelyVoiceTool: { type: Type.STRING, description: "If AI voice detected, likely tool used (ElevenLabs, etc.)" }
      }
    },
    visualAnalysis: {
      type: Type.OBJECT,
      properties: {
        facialConsistency: { type: Type.STRING, description: "Analysis of facial features across frames" },
        backgroundAnalysis: { type: Type.STRING, description: "Analysis of background elements" },
        lightingConsistency: { type: Type.STRING, description: "Analysis of lighting and shadows" },
        motionAnalysis: { type: Type.STRING, description: "Analysis of motion patterns and physics" }
      }
    },
    sourceVerification: {
      type: Type.OBJECT,
      properties: {
        channelHistory: { type: Type.STRING, description: "Analysis of channel's history with AI content" },
        communityDiscussion: { type: Type.STRING, description: "What viewers/community are saying" },
        factCheckResults: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Results from fact-checking searches" }
      }
    },
    originalSourceEstimate: { type: Type.STRING, description: "Best estimate of original source if content is manipulated" },
    safetyConcerns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Safety/misinformation concerns" },
    methodology: { type: Type.STRING, description: "Explanation of analysis methodology used" }
  },
  required: ["isGenerated", "confidence", "summary", "segments"]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input, inputType, mode } = req.body;

    if (!input || !inputType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Use more powerful model for thorough analysis
    const modelName = mode === 'DEEP' ? 'gemini-2.5-pro-preview-06-05' : 'gemini-2.5-flash-preview-05-20';
    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    };

    // Enable extended thinking for deep mode
    if (mode === 'DEEP') {
      (config as Record<string, unknown>).thinkingConfig = { thinkingBudget: 32768 };
    }

    let contents: Record<string, unknown>;
    if (inputType === 'url') {
      const videoIdMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      contents = {
        parts: [{
          text: `You are an elite AI forensics analyst specializing in deepfake detection and AI-generated content identification. Conduct an EXHAUSTIVE investigation of this video: ${input}
${videoId ? `Video ID: ${videoId}` : ''}

## INVESTIGATION PROTOCOL

### Phase 1: Source Intelligence Gathering
Use Google Search extensively to gather intelligence:
1. Search: "${videoId || 'this video'} deepfake detection"
2. Search: "${videoId || 'this video'} AI generated fake"
3. Search: "channel name + AI voice" or "channel name + synthetic"
4. Search for Reddit discussions, Twitter threads, or forum posts about this specific video
5. Search for any fact-checks or debunking articles
6. Search for the creator's disclosure of AI tools

### Phase 2: Content Analysis Framework
Analyze and report on EACH of these categories:

**AUDIO FORENSICS:**
- Voice pattern analysis: Is the voice natural or synthetic?
- Breathing patterns: Are there natural pauses and breaths?
- Emotion consistency: Do emotional inflections match content?
- Background audio: Any telltale AI audio artifacts?
- If AI voice suspected: Which tool likely used? (ElevenLabs, Murf, WellSaid, etc.)

**VISUAL FORENSICS:**
- Facial landmark tracking: Are facial movements consistent?
- Eye movement patterns: Natural or artificial eye behavior?
- Lip sync accuracy: Does audio perfectly match mouth movements?
- Skin texture analysis: Over-smoothed or artificial appearance?
- Background consistency: Any warping, artifacts, or inconsistencies?
- Lighting analysis: Do shadows behave naturally?
- Motion physics: Do movements follow natural physics?

**CONTEXTUAL ANALYSIS:**
- Content plausibility: Is the person saying something out of character?
- Historical verification: Has this person actually said this?
- Timeline consistency: Does this fit the person's known activities?

### Phase 3: Evidence Documentation
For EACH anomaly detected:
- Provide specific TIMESTAMP (e.g., "00:45", "02:15-02:30")
- Include DIRECT QUOTES from the video when possible
- Explain the TECHNICAL EVIDENCE in detail
- Rate the LIKELIHOOD (low/medium/high)
- Classify the ANOMALY TYPE

### Phase 4: Synthesis
Provide:
- Overall verdict with confidence percentage
- Comprehensive multi-paragraph summary
- List of all technical indicators found
- Safety concerns if this is misinformation
- Methodology explanation

BE THOROUGH. Take your time. This analysis should be comprehensive and detailed. If you find AI generation evidence, document it extensively with specific examples and timestamps.`
        }]
      };
      (config as Record<string, unknown>).tools = [{ googleSearch: {} }];
    } else {
      contents = {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: input } },
          { text: `You are an elite AI forensics analyst. Conduct a COMPREHENSIVE analysis of this image for AI generation.

## DETAILED ANALYSIS PROTOCOL

### Visual Artifact Detection
Examine and report on EACH:
1. **Facial Analysis**: Skin texture, pore patterns, facial symmetry, eye reflections
2. **Hand/Finger Analysis**: Digit count, joint positions, nail consistency
3. **Hair Analysis**: Individual strand rendering, hairline naturalness
4. **Background Analysis**: Object coherence, text rendering, perspective consistency
5. **Lighting Analysis**: Shadow directions, reflection consistency, light source logic
6. **Texture Analysis**: Fabric patterns, surface details, material rendering
7. **Edge Analysis**: Object boundaries, blending artifacts, halos

### AI Generator Signatures
Look for signatures of:
- Midjourney (painterly quality, specific aesthetic)
- DALL-E (certain texture patterns)
- Stable Diffusion (specific artifacts)
- This Person Does Not Exist (face generation patterns)

### Technical Indicators
Report on:
- Compression artifacts vs generation artifacts
- Metadata indicators (if visible)
- Resolution consistency
- Color channel anomalies

For EACH finding, provide:
- Specific location in image
- Detailed technical evidence
- Confidence level
- Anomaly classification

Provide a comprehensive multi-paragraph summary explaining your complete analysis methodology and findings.` }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config
    });

    const result = JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return res.status(500).json({ error: 'Analysis failed' });
  }
}
