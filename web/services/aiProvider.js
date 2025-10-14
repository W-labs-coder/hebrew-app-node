import OpenAI from 'openai';

// Centralized AI provider selection for translations (Grok default)
export const getAIProvider = () => {
  const p = (process.env.AI_PROVIDER || 'grok').toLowerCase();
  if (p === 'groq') return 'groq';
  // Auto-detect Groq key/URL even if provider isn't explicitly set
  const key = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GROQ_API_KEY || '';
  const wantsGroq = /^gsk_/.test(key) || /groq/i.test(process.env.GROK_BASE_URL || '') || /groq/i.test(process.env.XAI_BASE_URL || '') || /groq/i.test(process.env.GROQ_BASE_URL || '');
  if (wantsGroq) return 'groq';
  return p;
};

// Create an OpenAI-compatible client. If provider is 'grok', point the client to x.ai.
export function createTranslationClient() {
  const provider = getAIProvider();

  if (provider === 'grok') {
    const key = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GROQ_API_KEY;
    const wantsGroq = /^gsk_/.test(key || '') || /groq/i.test(process.env.GROK_BASE_URL || '') || /groq/i.test(process.env.XAI_BASE_URL || '');

    if (key) {
      if (wantsGroq) {
        const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
        return new OpenAI({ apiKey: key, baseURL });
      }
      const baseURL = process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
      return new OpenAI({ apiKey: key, baseURL });
    }
    // If Grok requested but no key, fall back to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      const baseURL = process.env.OPENAI_BASE_URL; // optional
      return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL });
    }
    throw new Error('No API key configured for Grok/Groq or OpenAI (set GROK_API_KEY/XAI_API_KEY/GROQ_API_KEY or OPENAI_API_KEY)');
  }

  // Explicit OpenAI provider
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL; // optional
    if (!apiKey) throw new Error('OpenAI API key not configured (set OPENAI_API_KEY)');
    return new OpenAI({ apiKey, baseURL });
  }

  // Unknown/other provider: default to Grok first, then OpenAI
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (grokKey) return new OpenAI({ apiKey: grokKey, baseURL: process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1' });
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) return new OpenAI({ apiKey: groqKey, baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1' });
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) return new OpenAI({ apiKey: openaiKey, baseURL: process.env.OPENAI_BASE_URL });
  throw new Error('No API key configured (set GROK_API_KEY/XAI_API_KEY or OPENAI_API_KEY)');
}

// Resolve bulk translation model per provider, overridable via AI_MODEL_BULK
export function getBulkTranslationModel() {
  const provider = getAIProvider();
  if (process.env.AI_MODEL_BULK) return process.env.AI_MODEL_BULK;
  if (provider === 'grok') return process.env.GROK_MODEL_BULK || 'grok-2-mini';
  if (provider === 'groq') return process.env.GROQ_MODEL_BULK || 'llama-3.3-70b-versatile';
  return process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini';
}
