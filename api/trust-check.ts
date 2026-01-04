import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }

    const modelName = 'gemini-2.0-flash';
    const config = {
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

    const result = JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error('Trust check error:', error);
    return res.status(500).json({ error: 'Trust check failed' });
  }
}
