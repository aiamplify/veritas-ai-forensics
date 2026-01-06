import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const factCheckSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallCredibility: { type: Type.NUMBER, description: "0-100 overall credibility score" },
    summary: { type: Type.STRING, description: "Comprehensive multi-paragraph summary of all findings" },
    claims: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          claim: { type: Type.STRING, description: "The specific claim being verified" },
          directQuote: { type: Type.STRING, description: "Exact quote from the content" },
          verdict: { type: Type.STRING, enum: ['true', 'false', 'misleading', 'unverified', 'partially-true'] },
          explanation: { type: Type.STRING, description: "Detailed explanation of why this verdict was reached" },
          confidence: { type: Type.NUMBER, description: "0-100 confidence in this verdict" },
          context: { type: Type.STRING, description: "Important context that affects interpretation" },
          sources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                uri: { type: Type.STRING },
                relevance: { type: Type.STRING, description: "How this source relates to the claim" }
              }
            }
          },
          counterEvidence: { type: Type.STRING, description: "Any evidence that contradicts the claim" }
        },
        required: ["claim", "verdict", "explanation", "confidence"]
      }
    },
    biasAnalysis: {
      type: Type.OBJECT,
      properties: {
        label: { type: Type.STRING, description: "Type of bias detected (political, commercial, ideological, etc.)" },
        intensity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        description: { type: Type.STRING, description: "Detailed analysis of the bias" },
        examples: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific examples of bias in the content" },
        affectedClaims: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Which claims are affected by bias" }
      }
    },
    logicalFallacies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          fallacy: { type: Type.STRING, description: "Name of the logical fallacy" },
          example: { type: Type.STRING, description: "Quote or example from the content" },
          explanation: { type: Type.STRING, description: "Why this is a logical fallacy" }
        }
      }
    },
    sourceAnalysis: {
      type: Type.OBJECT,
      properties: {
        primarySourcesUsed: { type: Type.BOOLEAN },
        expertsCited: { type: Type.ARRAY, items: { type: Type.STRING } },
        dataQuality: { type: Type.STRING, description: "Assessment of data/statistics quality" },
        missingContext: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Important context that was omitted" }
      }
    },
    methodology: { type: Type.STRING, description: "Explanation of fact-checking methodology used" }
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

    const modelName = 'gemini-2.5-pro-preview-06-05';
    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: factCheckSchema,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 24576 }
    };

    const prompt = inputType === 'url'
      ? `You are an elite fact-checker and investigative journalist. Conduct a COMPREHENSIVE fact-check of this content: ${input}

## FACT-CHECKING PROTOCOL

### Phase 1: Claim Extraction
1. Watch/read the ENTIRE content carefully
2. Extract EVERY verifiable claim made
3. Note DIRECT QUOTES for each claim
4. Identify the most significant/impactful claims

### Phase 2: Verification Process
For EACH claim:
1. **Search for Primary Sources**: Look for original studies, official statements, court documents
2. **Check Multiple Sources**: Cross-reference with at least 3 independent sources
3. **Verify Statistics**: Check if numbers/data are accurate and properly contextualized
4. **Check Expert Consensus**: What do experts in the relevant field say?
5. **Historical Accuracy**: Verify historical claims against established records
6. **Context Analysis**: Is important context being omitted?

### Phase 3: Bias Detection
Analyze for:
- Political bias (left/right leaning)
- Commercial bias (promoting products/services)
- Ideological bias (pushing specific worldview)
- Selection bias (cherry-picking data)
- Confirmation bias patterns
- Emotional manipulation tactics

### Phase 4: Logical Analysis
Identify logical fallacies:
- Ad hominem attacks
- Straw man arguments
- False dichotomies
- Appeal to authority without evidence
- Correlation/causation confusion
- Anecdotal evidence over data

### Phase 5: Source Quality Assessment
Evaluate:
- Are primary sources cited?
- Are experts properly credentialed?
- Is data from reputable sources?
- What important information is missing?

IMPORTANT: Ignore all advertisements and sponsored segments. Focus only on the main content.

Provide DETAILED explanations for each verdict. Include specific quotes and timestamps where possible. Be thorough - this analysis should be comprehensive.`
      : `You are an elite fact-checker. Conduct a COMPREHENSIVE verification of these claims:

${input}

## VERIFICATION PROTOCOL

For EACH claim:
1. Search for primary sources and original evidence
2. Cross-reference with multiple independent sources
3. Check expert consensus
4. Verify any statistics or data cited
5. Identify missing context
6. Check for logical fallacies

Analyze for bias, logical fallacies, and source quality. Provide DETAILED explanations with specific evidence for each verdict.`;

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
