import shopify from '../shopify.js';
import TranslationJob from '../models/TranslationJob.js';
import { asyncPool, normalize, translateBatchWithCacheExt, loadStoreCatalog, diffTranslatableContent } from '../services/translationUtils.js';
import path from 'path';
import fs from 'fs/promises';
import { createTranslationClient, getAIProvider } from '../services/aiProvider.js';
import ThemeSourceDigest from '../models/ThemeSourceDigest.js';
import SyncJob from '../models/SyncJob.js';
import { emitProgress } from '../services/progressBus.js';

let running = false;

export function startTranslationWorker() {
  if (running) return;
  running = true;
  const intervalMs = parseInt(process.env.TRANSLATION_WORKER_INTERVAL_MS || '5000', 10);

  setInterval(async () => {
    try {
      const job = await TranslationJob.findOne({ status: 'queued' }).sort({ createdAt: 1 });
      if (!job) return;

      await processJob(job);
    } catch (err) {
      console.error('Translation worker error:', err);
    }
  }, intervalMs);
}

async function processJob(jobDoc) {
  const jobId = jobDoc._id;
  const shop = jobDoc.shop;
  const locale = jobDoc.locale || 'he';

  try {
    await TranslationJob.findByIdAndUpdate(jobId, { status: 'running', progress: 0, error: '' });

    const offlineId = `offline_${shop}`;
    const sessionRecord = await shopify.config.sessionStorage.loadSession(offlineId);
    if (!sessionRecord?.accessToken) {
      throw new Error('No offline session found for shop');
    }

    const client = new shopify.api.clients.Graphql({ session: sessionRecord });
    const openai = createTranslationClient();
    console.log(`[Translations] Provider: ${getAIProvider()}`);

    // Fetch themes
    const themesResponse = await client.query({
      data: `query { themes(first: 250) { edges { node { id name role } } } }`
    });
    const themes = themesResponse?.body?.data?.themes?.edges?.map(e => e.node) || [];

    const freeThemes = themes.filter(
      (t) => [
        'crave','craft','origin','dawn','trade','ride','taste','spotlight','refresh','publisher','sense','studio','colorblock','color-block','color_block'
      ].some(n => t.name.toLowerCase().includes(n)) || t.role === 'main'
    );

    await TranslationJob.findByIdAndUpdate(jobId, {
      $set: { 'totals.themes': freeThemes.length },
    });

    const outputDir = path.join(process.cwd(), 'translations');
    await fs.mkdir(outputDir, { recursive: true });

    let processed = 0;

    for (const theme of freeThemes) {
      // Check cancel between themes
      const fresh = await TranslationJob.findById(jobId).lean();
      if (!fresh || fresh.status === 'canceled') {
        return;
      }

      const themeNameClean = theme.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `${themeNameClean}_${locale}.json`;
      const filePath = path.join(outputDir, fileName);

      try {
        await fs.access(filePath);
        await TranslationJob.findByIdAndUpdate(jobId, {
          $push: { results: { theme: theme.name, file: fileName, uniqueItems: 0, totalItems: 0, error: '' } },
        });
        processed++;
        const progress = Math.round((processed / Math.max(freeThemes.length, 1)) * 100);
        await TranslationJob.findByIdAndUpdate(jobId, { $set: { 'totals.processedThemes': processed, progress } });
        // Enqueue sync of existing file
        await SyncJob.create({ shop, themeId: theme.id, locale, filePath, status: 'queued' });
        emitProgress({ jobType: 'translate', type: 'enqueue-sync', jobId, shop, themeId: theme.id, locale, message: 'Existing file found; sync enqueued', progress });
        continue;
      } catch {}

      try {
        // Get translatable content
        const translatable = await client.query({
          data: `query { translatableResource(resourceId: "${theme.id}") { translatableContent { key value digest } } }`
        });
        const content = translatable?.body?.data?.translatableResource?.translatableContent || [];

        // Load previous digests and previous translations file (if any)
        const prev = await ThemeSourceDigest.findOne({ shop, themeId: theme.id, locale: 'en' }).lean();
        const prevDigests = prev?.digests || {};
        const { toTranslate: diffItems, unchangedCount, nextDigests } = diffTranslatableContent(content, prevDigests);

        // Load previous output file to reuse unchanged translations
        let prevObj = {};
        try { const rawPrev = await fs.readFile(filePath, 'utf8'); prevObj = JSON.parse(rawPrev); } catch (_) {}

        const contentsToTranslate = diffItems.filter(c => c.value && c.value.trim() !== '');

        const values = contentsToTranslate.map(c => c.value);
        const keys = contentsToTranslate.map(c => c.key);

        // Deduplicate
        const uniqueMap = new Map();
        const remap = [];
        const uniques = [];
        values.forEach((v, i) => {
          const n = normalize(v);
          if (!uniqueMap.has(n)) {
            uniqueMap.set(n, uniques.length);
            uniques.push(v);
          }
          remap[i] = uniqueMap.get(n);
        });

        const metrics = { cacheHits: 0, providerCalls: 0 };
        const storeCatalog = await loadStoreCatalog(shop, locale).catch(() => ({}));
        const translations = await translateBatchWithCacheExt(openai, uniques, locale, metrics, { storeCatalog });

        // Rebuild object
        const obj = { ...prevObj };
        keys.forEach((k, i) => { obj[k] = translations[remap[i]] || (prevObj[k] ?? ''); });

        await fs.writeFile(filePath, JSON.stringify(obj, null, 2), 'utf8');

        // Save updated digests snapshot
        await ThemeSourceDigest.updateOne(
          { shop, themeId: theme.id, locale: 'en' },
          { $set: { digests: nextDigests } },
          { upsert: true }
        );

        processed++;
        const progress = Math.round((processed / Math.max(freeThemes.length, 1)) * 100);
        await TranslationJob.findByIdAndUpdate(jobId, {
          $push: { results: { theme: theme.name, file: fileName, uniqueItems: uniques.length, totalItems: contentsToTranslate.length, error: '' } },
          $set: {
            progress,
            'totals.processedThemes': processed,
            'totals.strings': (jobDoc.totals?.strings || 0) + values.length,
            'totals.uniqueStrings': (jobDoc.totals?.uniqueStrings || 0) + uniques.length,
            'totals.cacheHits': (jobDoc.totals?.cacheHits || 0) + metrics.cacheHits,
            'totals.providerCalls': (jobDoc.totals?.providerCalls || 0) + metrics.providerCalls,
          }
        });

        // Enqueue Shopify sync job for this theme
        await SyncJob.create({ shop, themeId: theme.id, locale, filePath, status: 'queued' });
        emitProgress({ jobType: 'translate', type: 'theme-complete', jobId, shop, themeId: theme.id, locale, message: `Theme translated (${theme.name}); sync enqueued`, progress, meta: { unchangedCount } });
      } catch (err) {
        console.error(`Theme translation failed (${theme.name}):`, err);
        processed++;
        const progress = Math.round((processed / Math.max(freeThemes.length, 1)) * 100);
        await TranslationJob.findByIdAndUpdate(jobId, {
          $push: { results: { theme: theme.name, file: fileName, uniqueItems: 0, totalItems: 0, error: err?.message || 'error' } },
          $set: { progress, 'totals.processedThemes': processed }
        });
      }
    }

    await TranslationJob.findByIdAndUpdate(jobId, { status: 'completed', progress: 100 });
  } catch (err) {
    await TranslationJob.findByIdAndUpdate(jobId, { status: 'failed', error: err?.message || 'unknown error' });
  }
}
