import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));

// Health Check endpoint
app.get('/v1/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '0.3.0',
    model_version: 'darkguard-text-v1',
    timestamp: new Date().toISOString(),
    backend: 'Node.js + Express',
    ai_explanations_enabled: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Explain Service (/v1/explain) - Rewrites detection summaries into plain-language consumer guidance
app.post('/v1/explain', async (req: Request, res: Response) => {
  const { detections } = req.body;

  if (!detections || !Array.isArray(detections)) {
    return res.status(400).json({ error: 'detections array required' });
  }

  // If no Gemini API key configured, return default template-based plain explanations
  if (!process.env.GEMINI_API_KEY) {
    const fallback = detections.map((d: any) => ({
      id: d.id,
      aiExplanation: `Observed ${d.categoryName || d.category}: This design element often prompts hurried purchases. Review without urgency before deciding.`,
    }));
    return res.json({ explanations: fallback, source: 'template_fallback' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Build concise prompt strictly adhering to PRD: plain language, neutral, no accusation, no price modification
    const prompt = `You are DarkGuard AI explanation engine. Rephrase each of the following dark-pattern detection summaries into 1 concise, neutral sentence (max 25 words each) explaining to an online shopper what was observed without being accusatory.
Detections:
${JSON.stringify(detections, null, 2)}

Format response as a JSON array of objects: [{"id": string, "aiExplanation": string}]. Return ONLY valid JSON with no markdown formatting.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text?.trim() || '';
    const cleanJson = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    const parsed = JSON.parse(cleanJson);

    return res.json({
      explanations: parsed,
      source: 'gemini-2.5-flash',
    });
  } catch (error: any) {
    console.warn('Gemini explanation rewriting fallback triggered:', error?.message);
    const fallback = detections.map((d: any) => ({
      id: d.id,
      aiExplanation: `Observed ${d.categoryName || d.category}: Review this pricing and option carefully before checkout.`,
    }));
    return res.json({ explanations: fallback, source: 'template_fallback' });
  }
});

// Dev / Prod mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DarkGuard AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
