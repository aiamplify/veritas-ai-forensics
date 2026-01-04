import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input, inputType, mode } = req.body;

    if (!input || !inputType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const modelName = mode === 'DEEP' ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: analysisSchema
    };

    let contents: Record<string, unknown>;
    if (inputType === 'url') {
      contents = {
        parts: [{
          text: `Analyze this URL for AI generation or deepfakes: ${input}.
          CRITICAL INSTRUCTION: You MUST ignore any advertisements, pre-roll ads, or mid-roll commercials.
          Focus strictly on the main content produced by the channel owner/creator.
          Do not flag the video as AI-generated if the ad is AI-generated. Analyze the video itself.
          Provide a detailed breakdown of segments with timestamps where anomalies are detected.`
        }]
      };
      (config as Record<string, unknown>).tools = [{ googleSearch: {} }];
    } else {
      contents = {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: input } },
          { text: "Detect AI artifacts. Provide a confidence score and segment specific areas of the image if possible (use 'General' for timestamp)." }
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
