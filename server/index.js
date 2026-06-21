// ─────────────────────────────────────────────────────────────────────
// GreenPrint – Unified Express Server
//
//  • In production  → serves the Vite build at /  AND  /api routes
//  • In development → Vite dev server runs on :5173, this runs on :3001
//                     (Vite proxies /api → :3001 so you still get HMR)
//
// Single deployment URL on Render / Railway / Fly.io ✅
// ANTHROPIC_API_KEY is never exposed to the browser ✅
// ─────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const app        = express();
const PORT       = process.env.PORT || 3001;
const isProd     = process.env.NODE_ENV === 'production';
const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Middleware ────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// Dev: allow Vite dev server to call us
// Prod: same origin, so CORS is irrelevant — but keep for safety
app.use(cors({
  origin: isProd
    ? false                          // same-origin only in prod
    : ['http://localhost:5173'],     // allow Vite dev server
  methods: ['POST'],
}));

// ── Rate limiter (simple in-memory) ──────────────────────────────────
const rateLimitMap = new Map();
const RATE_LIMIT   = 10;   // max requests
const WINDOW_MS    = 60_000; // per minute

function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, start: now });
    return next();
  }
  entry.count++;
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }
  next();
}

// ── Input validation helper ───────────────────────────────────────────
function validatePayload(data) {
  const required = ['total_kg', 'label', 'breakdown'];
  for (const key of required) {
    if (!(key in data)) return `Missing field: ${key}`;
  }
  if (typeof data.total_kg !== 'number' || data.total_kg < 0 || data.total_kg > 200_000) {
    return 'Invalid total_kg value';
  }
  return null; // valid
}

// ── POST /api/ai-analyze ──────────────────────────────────────────────
app.post('/api/ai-analyze', rateLimit, async (req, res) => {
  const validationError = validatePayload(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const { total_kg, label, breakdown, comparisons } = req.body;

  // Build prompt from validated data — never trust raw user strings in the prompt
  const prompt = `You are CarbonSense AI, an expert environmental analyst embedded in the GreenPrint platform.

The user has completed their carbon footprint assessment. Here are the verified results:

TOTAL ANNUAL FOOTPRINT: ${total_kg.toLocaleString()} kg CO₂e
SCORE LABEL: ${label}
BREAKDOWN:
- 🏠 Energy:    ${breakdown.energy?.kg ?? 0} kg (${breakdown.energy?.percent ?? 0}%)
- 🚗 Transport: ${breakdown.transport?.kg ?? 0} kg (${breakdown.transport?.percent ?? 0}%)
- 🍽️ Food:      ${breakdown.food?.kg ?? 0} kg (${breakdown.food?.percent ?? 0}%)
- 🛍️ Lifestyle: ${breakdown.lifestyle?.kg ?? 0} kg (${breakdown.lifestyle?.percent ?? 0}%)

COMPARED TO BENCHMARKS:
- vs Global Average (4,800 kg): ${comparisons?.vs_global?.val ?? 0}%
- vs India Average (1,900 kg):  ${comparisons?.vs_india?.val ?? 0}%
- vs Paris Target (2,300 kg):   ${comparisons?.vs_paris?.val ?? 0}%

Your task:
1. Write a SHORT, PERSONALIZED 2-sentence analysis of their footprint (warm, non-judgmental tone).
2. Identify their SINGLE biggest opportunity for improvement.
3. Give 3 SPECIFIC, achievable actions tailored to their score, each with an estimated CO₂ saving.
4. End with ONE motivational sentence.

Keep the total response under 200 words. Use simple, clear language. Do NOT use markdown headers.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });

    const aiText = message.content[0]?.type === 'text'
      ? message.content[0].text
      : 'Analysis unavailable.';

    return res.json({ analysis: aiText });
  } catch (err) {
    console.error('[AI Error]', err?.message);
    // Return a graceful fallback — don't expose internal errors
    return res.status(502).json({
      error: 'AI analysis temporarily unavailable.',
      fallback: `Based on your ${label} score of ${total_kg.toLocaleString()} kg CO₂e, focus on your highest-emission category for the biggest impact.`,
    });
  }
});

// ── Health check ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve React build in production ───────────────────────────────────
if (isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  // React Router fallback — serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌿 GreenPrint server running`);
  console.log(`   Mode:    ${isProd ? 'production' : 'development'}`);
  console.log(`   Port:    ${PORT}`);
  console.log(`   AI key:  ${process.env.ANTHROPIC_API_KEY ? '✅ loaded' : '❌ missing (set ANTHROPIC_API_KEY)'}\n`);
});
