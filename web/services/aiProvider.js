import OpenAI from 'openai';

// Centralized AI provider selection (OpenAI default)
export const getAIProvider = () => (process.env.AI_PROVIDER || 'openai').toLowerCase();

// Create an OpenAI-compatible client with OpenAI first, then Groq, then Grok
export function createTranslationClient() {
  const provider = getAIProvider();

  // 1) OpenAI-first path
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL; // optional
    if (apiKey) return new OpenAI({ apiKey, baseURL });
    // Fallbacks if no OpenAI key
    if (process.env.GROQ_API_KEY) {
      const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
      return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL });
    }
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokKey) {
      const baseURL = process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
      return new OpenAI({ apiKey: grokKey, baseURL });
    }
    throw new Error('No API key configured for OpenAI/Groq/Grok');
  }

  // 2) Explicit Groq
  if (provider === 'groq') {
    const apiKey = process.env.GROQ_API_KEY || '';
    if (apiKey) {
      const baseURL = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
      return new OpenAI({ apiKey, baseURL });
    }
    // Fallbacks
    if (process.env.OPENAI_API_KEY) return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });
    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokKey) return new OpenAI({ apiKey: grokKey, baseURL: process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1' });
    throw new Error('No API key configured for Groq/OpenAI/Grok');
  }

  // 3) Explicit Grok (x.ai)
  if (provider === 'grok') {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || '';
    if (apiKey) {
      const baseURL = process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
      return new OpenAI({ apiKey, baseURL });
    }
    // Fallbacks
    if (process.env.OPENAI_API_KEY) return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });
    if (process.env.GROQ_API_KEY) return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1' });
    throw new Error('No API key configured for Grok/OpenAI/Groq');
  }

  // 4) Unknown: OpenAI first, then Groq, then Grok
  if (process.env.OPENAI_API_KEY) return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL });
  if (process.env.GROQ_API_KEY) return new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1' });
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  if (grokKey) return new OpenAI({ apiKey: grokKey, baseURL: process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1' });
  throw new Error('No API key configured (OpenAI/Groq/Grok)');
}

// Resolve bulk translation model per provider, overridable via AI_MODEL_BULK
export function getBulkTranslationModel() {
  const provider = getAIProvider();
  if (process.env.AI_MODEL_BULK) return process.env.AI_MODEL_BULK;

  // Mirror createTranslationClient selection so model aligns with endpoint
  if (provider === 'openai') {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini';
    if (process.env.GROQ_API_KEY) return process.env.GROQ_MODEL_BULK || 'llama-3.3-70b-versatile';
    if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) return process.env.GROK_MODEL_BULK || 'grok-2-mini';
    return 'gpt-4o-mini';
  }
  if (provider === 'groq') {
    if (process.env.GROQ_API_KEY) return process.env.GROQ_MODEL_BULK || 'llama-3.3-70b-versatile';
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini';
    if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) return process.env.GROK_MODEL_BULK || 'grok-2-mini';
    return 'llama-3.3-70b-versatile';
  }
  if (provider === 'grok') {
    if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) return process.env.GROK_MODEL_BULK || 'grok-2-mini';
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini';
    if (process.env.GROQ_API_KEY) return process.env.GROQ_MODEL_BULK || 'llama-3.3-70b-versatile';
    return 'grok-2-mini';
  }
  // Unknown: OpenAI → Groq → Grok
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini';
  if (process.env.GROQ_API_KEY) return process.env.GROQ_MODEL_BULK || 'llama-3.3-70b-versatile';
  if (process.env.GROK_API_KEY || process.env.XAI_API_KEY) return process.env.GROK_MODEL_BULK || 'grok-2-mini';
  return 'gpt-4o-mini';
}
