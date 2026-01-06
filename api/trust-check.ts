import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Schema } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const trustAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    trustScore: { type: Type.NUMBER, description: "0-100 score. 0 is definite scam, 100 is highly trusted" },
    verdict: { type: Type.STRING, enum: ['SAFE', 'CAUTION', 'SCAM', 'UNKNOWN'] },
    summary: { type: Type.STRING, description: "Comprehensive multi-paragraph analysis of findings" },
    riskFactors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING, description: "The risk factor identified" },
          severity: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
          evidence: { type: Type.STRING, description: "Specific evidence for this risk" },
          source: { type: Type.STRING, description: "Where this information was found" }
        }
      },
      description: "Detailed red flags with evidence"
    },
    trustSignals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          signal: { type: Type.STRING, description: "The trust signal identified" },
          strength: { type: Type.STRING, enum: ['weak', 'moderate', 'strong'] },
          evidence: { type: Type.STRING, description: "Specific evidence for this signal" }
        }
      },
      description: "Detailed green flags with evidence"
    },
    businessDetails: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        registeredName: { type: Type.STRING, description: "Official registered business name if different" },
        ageEstimate: { type: Type.STRING },
        domainAge: { type: Type.STRING },
        location: { type: Type.STRING },
        contactInfo: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            address: { type: Type.STRING },
            verified: { type: Type.BOOLEAN }
          }
        },
        socialPresence: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    reviewAnalysis: {
      type: Type.OBJECT,
      properties: {
        trustpilotScore: { type: Type.STRING },
        trustpilotReviewCount: { type: Type.STRING },
        bbbRating: { type: Type.STRING },
        redditMentions: { type: Type.STRING, description: "Summary of Reddit discussions" },
        otherReviews: { type: Type.ARRAY, items: { type: Type.STRING } },
        fakeReviewIndicators: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    scamIndicators: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          indicator: { type: Type.STRING },
          description: { type: Type.STRING },
          commonIn: { type: Type.STRING, description: "What type of scam this is common in" }
        }
      }
    },
    priceAnalysis: {
      type: Type.OBJECT,
      properties: {
        listedPrice: { type: Type.STRING },
        marketPrice: { type: Type.STRING },
        isDropshipping: { type: Type.BOOLEAN },
        aliexpressMatch: { type: Type.STRING, description: "If dropshipping, original AliExpress/Chinese price" },
        priceVerdict: { type: Type.STRING }
      }
    },
    websiteAnalysis: {
      type: Type.OBJECT,
      properties: {
        sslCertificate: { type: Type.BOOLEAN },
        professionalDesign: { type: Type.BOOLEAN },
        grammarIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
        stockPhotos: { type: Type.BOOLEAN },
        missingPages: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Missing important pages like Terms, Privacy, etc." },
        paymentMethods: { type: Type.ARRAY, items: { type: Type.STRING } },
        returnPolicy: { type: Type.STRING }
      }
    },
    similarScams: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Similar known scams or websites" },
    recommendation: { type: Type.STRING, description: "Clear actionable recommendation for the user" },
    methodology: { type: Type.STRING, description: "Explanation of investigation methodology" }
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

    const modelName = 'gemini-2.5-pro-preview-06-05';
    const config: Record<string, unknown> = {
      responseMimeType: "application/json",
      responseSchema: trustAnalysisSchema,
      tools: [{ googleSearch: {} }],
      thinkingConfig: { thinkingBudget: 24576 }
    };

    const prompt = `You are an elite fraud investigator and consumer protection specialist. Conduct a COMPREHENSIVE trust and safety audit of this URL: ${url}

## INVESTIGATION PROTOCOL

### Phase 1: Business Verification
Use Google Search to investigate:
1. **Company Registration**: Search for official business registration, incorporation records
2. **Physical Presence**: Verify the business address exists (Google Maps, Street View)
3. **Contact Verification**: Check if phone numbers and emails are legitimate
4. **Social Media**: Find and verify official social media accounts
5. **Domain History**: Check domain age and registration details (WHOIS)

### Phase 2: Reputation Research
Search extensively for:
1. **Trustpilot**: Find their rating and read recent reviews
2. **BBB (Better Business Bureau)**: Check rating and complaints
3. **Reddit**: Search "site:reddit.com [company name] scam" or "review"
4. **Scam Databases**: Search ScamAdviser, ScamDoc, and similar sites
5. **News Articles**: Any news coverage about the company
6. **Consumer Complaints**: Search consumer protection agency complaints

### Phase 3: Website Analysis
Evaluate:
1. **Professional Quality**: Design, grammar, spelling errors
2. **Legal Pages**: Terms of Service, Privacy Policy, Return Policy - are they legitimate or copied?
3. **Contact Information**: Is there real contact info or just a form?
4. **SSL Certificate**: Is the site secure?
5. **Payment Methods**: Are there secure, reversible payment options?
6. **Trust Badges**: Are trust badges legitimate or fake?

### Phase 4: Product/Price Analysis (if applicable)
1. **Reverse Image Search**: Are product images stolen?
2. **Price Comparison**: Search the product on AliExpress, Amazon, etc.
3. **Dropshipping Detection**: Is this a cheap item marked up significantly?
4. **Too Good To Be True**: Are prices unrealistically low?

### Phase 5: Scam Pattern Recognition
Look for common scam indicators:
- Pressure tactics (limited time, low stock)
- No physical address or fake address
- Only accepts non-reversible payments
- Too-good-to-be-true pricing
- Poor grammar/spelling
- Copied content from other sites
- Recently created domain
- Hidden WHOIS information
- Fake reviews or testimonials
- No social media presence or fake followers

### Phase 6: Synthesis
Provide:
- Overall Trust Score (0-100)
- Clear Verdict (SAFE, CAUTION, SCAM, UNKNOWN)
- Comprehensive summary with all findings
- Specific actionable recommendation

Be THOROUGH. This analysis should help the user make an informed decision. Search extensively and provide specific evidence for all findings.`;

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
