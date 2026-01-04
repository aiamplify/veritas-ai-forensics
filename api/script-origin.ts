import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, videoTitle, channelName } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Missing URL' });
    }

    const modelName = 'gemini-2.0-flash';
    const config = {
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

    const result = JSON.parse(response.text.replace(/```json\n?|\n?```/g, '').trim());
    return res.status(200).json(result);
  } catch (error) {
    console.error('Script origin error:', error);
    return res.status(500).json({ error: 'Script origin check failed' });
  }
}
