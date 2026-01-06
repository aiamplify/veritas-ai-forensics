import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const scriptOriginSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalityScore: { type: Type.NUMBER, description: "0-100 score where 100 is completely original" },
    isOriginal: { type: Type.BOOLEAN },
    attributionSummary: { type: Type.STRING, description: "Comprehensive multi-paragraph summary of attribution findings" },
    matchedSources: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          textSnippet: { type: Type.STRING, description: "The exact text from the video that matches" },
          originalText: { type: Type.STRING, description: "The original text from the source" },
          sourceTitle: { type: Type.STRING, description: "Title of the original work" },
          author: { type: Type.STRING, description: "Author of the original work" },
          publicationDate: { type: Type.STRING, description: "When the original was published" },
          uri: { type: Type.STRING, description: "URL to the source" },
          type: { type: Type.STRING, enum: ['verbatim', 'paraphrased', 'derivative', 'inspired'] },
          similarity: { type: Type.NUMBER, description: "0-100 similarity score" },
          timestamp: { type: Type.STRING, description: "When in the video this appears" },
          explanation: { type: Type.STRING, description: "Detailed explanation of the match" }
        },
        required: ["textSnippet", "sourceTitle", "type", "similarity"]
      }
    },
    literaryContext: { type: Type.STRING, description: "Context about the literary/academic sources" },
    analysisDetails: {
      type: Type.OBJECT,
      properties: {
        totalSegmentsAnalyzed: { type: Type.NUMBER },
        uniqueSourcesFound: { type: Type.NUMBER },
        primaryInfluences: { type: Type.ARRAY, items: { type: Type.STRING } },
        writingStyle: { type: Type.STRING, description: "Analysis of writing style patterns" },
        commonThemes: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    potentialPlagiarism: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          severity: { type: Type.STRING, enum: ['minor', 'moderate', 'significant', 'extensive'] },
          description: { type: Type.STRING },
          evidence: { type: Type.STRING }
        }
      }
    },
    aiGeneratedContent: {
      type: Type.OBJECT,
      properties: {
        detected: { type: Type.BOOLEAN },
        confidence: { type: Type.NUMBER },
        indicators: { type: Type.ARRAY, items: { type: Type.STRING } },
        likelyTool: { type: Type.STRING, description: "If AI-written, likely tool (ChatGPT, Claude, etc.)" }
      }
    },
    methodology: { type: Type.STRING, description: "Explanation of analysis methodology" }
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

    const modelName = 'gemini-2.5-pro-preview-06-05';
    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: scriptOriginSchema,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 24576 }
    };

    let prompt = `You are an elite plagiarism detection specialist and literary analyst. Conduct a COMPREHENSIVE origin analysis of the script/narration in this video: ${url}

${videoTitle ? `Video Title: "${videoTitle}"` : ''}
${channelName ? `Channel Name: "${channelName}"` : ''}

## SCRIPT ORIGIN ANALYSIS PROTOCOL

### Phase 1: Content Extraction
1. Listen to/transcribe the MAIN spoken content (ignore ads, intros, outros)
2. Identify key phrases, distinctive sentences, and memorable quotes
3. Note any claims of original authorship or attribution given

### Phase 2: Source Investigation
Use Google Search extensively to find potential sources:

**Literary Sources:**
- Search for distinctive phrases in quotes
- Check against famous books, essays, and articles
- Look for classic literature, philosophy, self-help books
- Check motivational speakers and TED talks

**Academic Sources:**
- Search academic papers and journals
- Check Wikipedia and encyclopedias
- Look for educational content

**Historical Sources:**
- Famous speeches and quotes
- Historical documents
- Religious texts

**Online Sources:**
- Reddit posts and comments
- Blog posts and articles
- Other YouTube videos
- Social media content

### Phase 3: AI Generation Detection
Analyze if the script appears AI-generated:
- Repetitive sentence structures
- Generic phrasing patterns
- Lack of personal anecdotes or specific details
- Overly polished or "perfect" prose
- ChatGPT/Claude-like patterns

### Phase 4: Similarity Analysis
For EACH potential match found:
- Provide the EXACT quote from the video
- Provide the ORIGINAL text from the source
- Note the timestamp in the video
- Calculate similarity percentage
- Classify as verbatim, paraphrased, derivative, or inspired
- Explain the connection in detail

### Phase 5: Attribution Assessment
Determine:
- Does the creator give proper credit?
- Are sources acknowledged?
- Is this fair use or potential plagiarism?
- What are the ethical implications?

CRITICAL: Ignore any ads, commercials, or sponsored readings. Focus on the narrative spoken by the main creator.

Be THOROUGH. Search extensively. This analysis should be comprehensive with specific examples and citations.`;

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
