import crypto from 'crypto';
import TranslationMemory from "../models/TranslationMemory.js";

export const envInt = (name, fallback) => {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

export const TRANSLATION_BATCH_SIZE = envInt('TRANSLATION_BATCH_SIZE', 100);
export const TRANSLATION_CONCURRENCY = envInt('TRANSLATION_CONCURRENCY', 10);
export const THEMES_CONCURRENCY = envInt('THEMES_CONCURRENCY', 2);
// Select model by provider (Grok default), overridable by AI_MODEL_BULK
export const AI_PROVIDER = (process.env.AI_PROVIDER || 'grok').toLowerCase();
export const AI_MODEL_BULK = process.env.AI_MODEL_BULK
  || (AI_PROVIDER === 'grok'
      ? (process.env.GROK_MODEL_BULK || 'grok-2-mini')
      : (process.env.OPENAI_MODEL_BULK || 'gpt-4o-mini'));

export async function asyncPool(poolLimit, array, iteratorFn) {
  const ret = [];
  const executing = [];
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item));
    ret.push(p);

    if (poolLimit <= array.length) {
      const e = p.then(() => executing.splice(executing.indexOf(e), 1));
      executing.push(e);
      if (executing.length >= poolLimit) {
        await Promise.race(executing);
      }
    }
  }
  return Promise.all(ret);
}

export function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export const normalize = (s) => (s ?? "").trim();

// Mask Liquid tokens only (leave HTML tags)
export const maskTokens = (text) => {
  const masks = [];
  let masked = text;
  masked = masked.replace(/\{\{[^}]*\}\}/g, (m) => {
    const id = `__LIQUID_VAR_${masks.length}__`;
    masks.push({ id, value: m });
    return id;
  });
  masked = masked.replace(/\{%[^%]*%\}/g, (m) => {
    const id = `__LIQUID_TAG_${masks.length}__`;
    masks.push({ id, value: m });
    return id;
  });
  return { masked, masks };
};

export const unmaskTokens = (text, masks) => {
  let out = text;
  for (const { id, value } of masks) {
    out = out.replaceAll(id, value);
  }
  return out;
};

export const hashSource = (locale, text) =>
  crypto.createHash('sha256').update(`${locale}|${normalize(text)}`).digest('hex');

// Optional pre-seeded catalog exact-match lookup
let preseedCache = null;
async function loadPreseedCatalog(locale) {
  if (preseedCache) return preseedCache;
  try {
    // Dynamically import at runtime; keep optional
    const data = await import(`../translations/catalog/${locale}.json`, { assert: { type: 'json' } }).catch(() => null);
    preseedCache = data?.default || {};
  } catch {
    preseedCache = {};
  }
  return preseedCache;
}

export async function translateBatchWithCache(openai, values, locale, metrics = { cacheHits: 0, providerCalls: 0 }) {
  // Pre-seeded catalog
  const catalog = await loadPreseedCatalog(locale).catch(() => ({}));

  const items = values.map((value, idx) => {
    const { masked, masks } = maskTokens(value);
    const sourceHash = hashSource(locale, masked);
    return { idx, value, masked, masks, sourceHash };
  });

  const hashes = items.map(i => i.sourceHash);
  const existing = await TranslationMemory.find({ sourceHash: { $in: hashes }, locale }).lean();
  const cacheMap = new Map(existing.map(doc => [doc.sourceHash, doc.translation]));

  // Fill from cache/catalog
  const translated = new Array(values.length);
  const toTranslate = [];
  for (const it of items) {
    let cached = cacheMap.get(it.sourceHash);
    if (!cached && catalog && catalog[it.value]) {
      cached = catalog[it.value];
    }
    if (cached) {
      translated[it.idx] = unmaskTokens(cached, it.masks);
      metrics.cacheHits++;
    } else {
      toTranslate.push(it);
    }
  }

  if (toTranslate.length === 0) return translated;

  const chunks = chunkArray(toTranslate, TRANSLATION_BATCH_SIZE);

  const callChunk = async (chunk) => {
    const maskedValues = chunk.map(i => i.masked);
    const system = `Translate the following texts from English to Hebrew. Maintain HTML and placeholders exactly. Return ONLY a JSON array of translated strings in the same order.`;

    const maxAttempts = 4;
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        metrics.providerCalls++;
        const resp = await openai.chat.completions.create({
          model: AI_MODEL_BULK,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: JSON.stringify(maskedValues) }
          ],
          temperature: 0.2
        });
        const content = resp.choices?.[0]?.message?.content ?? "";
        let arr;
        try {
          arr = JSON.parse(content);
        } catch (e) {
          const match = content.match(/\[[\s\S]*\]/);
          if (match) arr = JSON.parse(match[0]);
          else throw e;
        }
        if (!Array.isArray(arr)) throw new Error('Expected array from model');

        const ops = [];
        arr.forEach((t, idx) => {
          const item = chunk[idx];
          if (!item) return;
          const unmasked = unmaskTokens(t || "", item.masks);
          translated[item.idx] = unmasked;
          ops.push({
            updateOne: {
              filter: { sourceHash: item.sourceHash, locale },
              update: { $set: { sourceHash: item.sourceHash, locale, source: item.masked, translation: t || "" } },
              upsert: true
            }
          });
        });
        if (ops.length) await TranslationMemory.bulkWrite(ops, { ordered: false });
        return;
      } catch (err) {
        lastErr = err;
        const delay = Math.min(2000 * Math.pow(2, attempt - 1), 15000);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastErr;
  };

  await asyncPool(
    TRANSLATION_CONCURRENCY,
    chunks,
    callChunk
  );

  return translated;
}
