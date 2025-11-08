import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import User from '../models/User.js';

const router = express.Router();

// Merge base dictionary with store-specific translations if available
async function loadBaseDictionary(locale) {
  // ENV override
  const basePath = process.env.BASE_DICTIONARY_PATH;
  if (basePath) {
    try {
      const raw = await fs.readFile(basePath, 'utf8');
      return JSON.parse(raw);
    } catch (_) {}
  }
  // Default preseed catalog
  try {
    const p = path.join(process.cwd(), 'web', 'translations', 'catalog', `${locale}.json`);
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return {};
  }
}

async function loadStoreDictionary(shop, themeName, locale) {
  // Try a store-specific override file: translations/catalog/stores/<shop>_<locale>.json
  try {
    const dir = path.join(process.cwd(), 'web', 'translations', 'catalog', 'stores');
    const fp = path.join(dir, `${shop}_${locale}.json`);
    const raw = await fs.readFile(fp, 'utf8');
    return JSON.parse(raw);
  } catch (_) {}

  // Try prebuilt theme translation file as a flat object
  try {
    if (themeName) {
      const safe = themeName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const p = path.join(process.cwd(), 'web', 'translations', `${safe}_${locale}.json`);
      const raw = await fs.readFile(p, 'utf8');
      // This JSON is keyed by theme keys (e.g., sections.header.title), not visible strings.
      // For hybrid mode, we need visible string mapping; this file is not ideal, but include
      // values as hints by reverse-mapping identical value strings when possible.
      const obj = JSON.parse(raw);
      const map = {};
      Object.values(obj).forEach((v) => {
        if (typeof v === 'string' && v.trim()) {
          map[v] = v; // no-op; cannot derive English→Hebrew map reliably from keys
        }
      });
      return map;
    }
  } catch (_) {}
  return {};
}

// GET /api/locales/:locale.json?shop=<shop>&theme=<themeName>
router.get('/:locale.json', async (req, res) => {
  try {
    const locale = (req.params.locale || 'he').toLowerCase();
    const shop = req.query.shop || '';
    let themeName = req.query.theme || '';

    // If authenticated, try to infer theme from user
    if (!themeName && res.locals?.shopify?.session?.shop) {
      const u = await User.findOne({ shop: res.locals.shopify.session.shop }).lean();
      themeName = u?.selectedThemeName || '';
    }

    const base = await loadBaseDictionary(locale);
    const store = shop ? await loadStoreDictionary(shop, themeName, locale) : {};
    const merged = { ...base, ...store };
    res.status(200).json({ success: true, locale, count: Object.keys(merged).length, data: merged, dev: 'ife' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, dev: 'ife' });
  }
});

export default router;
