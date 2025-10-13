import OpenAI from 'openai';

// Centralized AI provider selection for translations (Grok default)
export const getAIProvider = () => (process.env.AI_PROVIDER || 'grok').toLowerCase();

export function createTranslationClient() {
  const provider = getAIProvider();
  if (provider === 'grok') {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const baseURL = process.env.GROK_BASE_URL || process.env.XAI_BASE_URL || 'https://api.x.ai/v1';
    if (!apiKey) {
      throw new Error('Grok API key not configured (set GROK_API_KEY)');
    }
    return new OpenAI({ apiKey, baseURL });
  }

  // Fallback to OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured (set OPENAI_API_KEY)');
  }
  return new OpenAI({ apiKey });
}

// Resolve bulk translation model per provider, overridable via AI_MODEL_BULK
export function getBulkTranslationModel() {
  const provider = getAIProvider();
  if (process.env.AI_MODEL_BULK) return process.env.AI_MODEL_BULK;
  if (provider === 'grok') return process.env.GROK_MODEL_BULK || 'grok-2-mini';
  return process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini';
}

