import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    isGenerated: { type: Type.BOOLEAN, description: "True if evidence suggests AI-generated content, false if authentic or insufficient evidence" },
    confidence: { type: Type.NUMBER, description: "0-100 confidence in the assessment" },
    summary: { type: Type.STRING, description: "Detailed explanation of the analysis findings" },
    segments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Start time or 'General' for overall findings" },
          description: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
          anomalyType: { type: Type.STRING, enum: ['visual', 'audio', 'context', 'metadata', 'source-analysis'] }
        }
      }
    },
    originalSourceEstimate: { type: Type.STRING },
    safetyConcerns: { type: Type.ARRAY, items: { type: Type.STRING } },
    evidenceFound: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of evidence sources found" }
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
      // Extract video ID for better search
      const videoIdMatch = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      contents = {
        parts: [{
          text: `You are an AI content forensics expert. Investigate whether this video contains AI-generated or deepfake content: ${input}
${videoId ? `Video ID: ${videoId}` : ''}

INVESTIGATION STEPS - Use Google Search to:
1. Search for "${videoId || input} deepfake" or "${videoId || input} AI generated" - look for fact-checks or discussions
2. Search for the channel/creator name + "AI" or "fake" to see if they're known for AI content
3. Search for any news articles or Reddit discussions about this specific video being AI-generated
4. Look for reverse image/video searches or debunking articles

ANALYSIS CRITERIA:
- Is the creator known for making AI-generated content? (Many channels now use AI voices, avatars, or fully synthetic videos)
- Are there any reports, fact-checks, or discussions indicating this video is AI-generated?
- Does the video description or channel disclose AI use?
- Are commenters or viewers discussing whether the content is AI-generated?

BE SKEPTICAL: Many videos today use AI voices (ElevenLabs, etc.), AI avatars, AI-generated imagery, or are fully synthetic.
If you find ANY evidence of AI generation, set isGenerated to true.
If the creator is known for AI content, assume this video is also AI-generated unless proven otherwise.

Provide specific evidence from your searches. If you cannot find information, indicate low confidence rather than assuming authentic.`
        }]
      };
      (config as Record<string, unknown>).tools = [{ googleSearch: {} }];
    } else {
      contents = {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: input } },
          { text: `Analyze this image for AI generation artifacts. Look for:
- Unnatural skin textures, hair, or fabric patterns
- Inconsistent lighting or shadows
- Distorted backgrounds, text, or hands
- Over-smoothed or plastic-looking surfaces
- Repetitive patterns or symmetry issues
- Watermarks or signatures of AI generators (Midjourney, DALL-E, Stable Diffusion styles)

Be critical - many images today are AI-generated. If you see ANY telltale signs, mark as generated with appropriate confidence.` }
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
