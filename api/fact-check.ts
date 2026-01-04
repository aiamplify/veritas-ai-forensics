import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input, inputType } = req.body;

    if (!input) {
      return res.status(400).json({ error: 'Missing input' });
    }

    const modelName = 'gemini-2.0-flash';
    const config = {
      responseMimeType: "application/json",
      responseSchema: factCheckSchema,
      tools: [{ googleSearch: {} }]
    };

    const prompt = inputType === 'url'
      ? `Fact-check the claims in the MAIN CONTENT of this video URL: ${input}.
         IMPORTANT: Ignore all advertisements and sponsored segments. Verify only the claims made by the content creator.`
      : `Verify these claims: ${input}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [{ text: prompt }] },
      config
    });

    const result = JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error('Fact-check error:', error);
    return res.status(500).json({ error: 'Fact-check failed' });
  }
}
