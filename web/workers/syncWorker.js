import shopify from '../shopify.js';
import SyncJob from '../models/SyncJob.js';
import TranslationKeyStatus from '../models/TranslationKeyStatus.js';
import { progressBus, emitProgress } from '../services/progressBus.js';
import { unflattenToNested } from '../services/translationUtils.js';
import fs from 'fs/promises';

let running = false;

export function startSyncWorker() {
  if (running) return;
  running = true;
  const intervalMs = parseInt(process.env.SYNC_WORKER_INTERVAL_MS || '5000', 10);

  setInterval(async () => {
    try {
      const job = await SyncJob.findOne({ status: 'queued' }).sort({ createdAt: 1 });
      if (!job) return;
      await processSyncJob(job);
    } catch (err) {
      console.error('Sync worker error:', err);
    }
  }, intervalMs);
}

async function processSyncJob(jobDoc) {
  const jobId = jobDoc._id;
  const { shop, themeId, locale } = jobDoc;

  try {
    await SyncJob.findByIdAndUpdate(jobId, { status: 'running', progress: 0, error: '' });
    emitProgress({ jobType: 'sync', type: 'start', jobId, shop, themeId, locale, message: 'Sync started', progress: 0 });

    const offlineId = `offline_${shop}`;
    const sessionRecord = await shopify.config.sessionStorage.loadSession(offlineId);
    if (!sessionRecord?.accessToken) throw new Error('No offline session found for shop');

    const client = new shopify.api.clients.Graphql({ session: sessionRecord });
    const rest = new shopify.api.clients.Rest({ session: sessionRecord });

    const themeNumericId = themeId.toString().includes('/') ? themeId.toString().split('/').pop() : themeId;
    const assetKey = `locales/${locale}.json`;

    let keys = jobDoc.keys || [];

    // 1. If filePath exists, upload as nested locale asset (best-effort)
    if (jobDoc.filePath) {
      try {
        const raw = await fs.readFile(jobDoc.filePath, 'utf8');
        const flat = JSON.parse(raw);
        // Convert flat keys to nested JSON (required for locale files)
        const nested = unflattenToNested(flat);
        await rest.put({ path: `themes/${themeNumericId}/assets`, data: { asset: { key: assetKey, value: JSON.stringify(nested) } }, type: 'application/json' });
        console.log(`[SyncWorker] Locale asset uploaded for ${locale}`);
      } catch (e) {
        console.warn('[SyncWorker] Asset upload failed:', e?.message || e);
      }
    }

    // 2. If no keys to register via API, we're done
    if (!keys.length) {
      await SyncJob.findByIdAndUpdate(jobId, { status: 'completed', progress: 100, 'totals.total': 0 });
      emitProgress({ jobType: 'sync', type: 'complete', jobId, shop, themeId, locale, message: 'Sync completed (asset only)', progress: 100 });
      return;
    }

    // Register provided keys in batches of 100
    const BATCH_SIZE = 100;
    const batches = [];
    for (let i = 0; i < keys.length; i += BATCH_SIZE) batches.push(keys.slice(i, i + BATCH_SIZE));

    const resourceId = themeId.startsWith('gid://') ? themeId : `gid://shopify/Theme/${themeId.toString().split('/').pop()}`;
    let total = keys.length, success = 0, failed = 0;

    const attempt = (jobDoc.meta && jobDoc.meta.attempt) ? jobDoc.meta.attempt : 1;
    const MAX_ATTEMPTS = parseInt(process.env.SYNC_JOB_MAX_ATTEMPTS || '2', 10);
    const failedKeysAll = [];

    for (let idx = 0; idx < batches.length; idx++) {
      const batch = batches[idx];
      try {
        const response = await client.query({
          data: {
            query: `mutation RegisterTranslations($resourceId: ID!, $translations: [TranslationInput!]!) {
              translationsRegister(resourceId: $resourceId, translations: $translations) {
                translations { key locale }
                userErrors { field message }
              }
            }`,
            variables: {
              resourceId,
              translations: batch.map(k => ({
                key: k.key,
                locale,
                value: k.value,
                ...(k.digest ? { translatableContentDigest: k.digest } : {})
              }))
            },
          },
        });
        const errs = response?.body?.data?.translationsRegister?.userErrors || [];
        const batchSuccess = batch.length - errs.length;
        success += batchSuccess;
        failed += errs.length;

        // Update per-key statuses
        for (const item of batch) {
          try {
            await TranslationKeyStatus.updateOne({ shop, themeId, locale, key: item.key }, { $set: { status: 'synced', error: '' } }, { upsert: true });
          } catch {}
        }
        if (errs.length > 0) {
          let mapped = [];
          // Try to map failure fields back to keys (best-effort)
          for (let i = 0; i < errs.length; i++) {
            const e = errs[i];
            const field = e.field;
            let keyStr = '';
            if (Array.isArray(field) && field.length) keyStr = field[0];
            if (!keyStr) {
              // fallback to the batch[i] if lengths match
              if (i < batch.length) keyStr = batch[i].key;
            }
            if (keyStr) {
              mapped.push(keyStr);
              await TranslationKeyStatus.updateOne({ shop, themeId, locale, key: keyStr }, { $set: { status: 'failed', error: e.message || 'error' } }, { upsert: true });
            }
          }
          if (mapped.length === 0) {
            // If we couldn't map, conservatively mark the whole batch as failed for requeue
            mapped = batch.map(b => b.key);
          }
          failedKeysAll.push(...mapped);
        }
      } catch (err) {
        // mark all keys in this batch as failed
        for (const item of batch) {
          try {
            await TranslationKeyStatus.updateOne({ shop, themeId, locale, key: item.key }, { $set: { status: 'failed', error: err?.message || 'error' } }, { upsert: true });
          } catch {}
        }
        failed += batch.length;
        failedKeysAll.push(...batch.map(b => b.key));
      }
      const progress = Math.round(((idx + 1) / batches.length) * 100);
      await SyncJob.findByIdAndUpdate(jobId, { progress, totals: { total, success, failed } });
      emitProgress({ jobType: 'sync', type: 'progress', jobId, shop, themeId, locale, message: `Synced batch ${idx + 1}/${batches.length}`, progress, meta: { total, success, failed } });
    }

    // Auto-requeue failed keys if attempts remain
    if (failed > 0 && attempt < MAX_ATTEMPTS && failedKeysAll.length > 0) {
      const dedup = Array.from(new Set(failedKeysAll));
      const failedPairs = dedup.map(k => {
        const found = keys.find(it => it.key === k);
        return found ? { key: found.key, value: found.value, digest: found.digest || '' } : { key: k, value: ' ' };
      });
      await SyncJob.create({ shop, themeId, locale, keys: failedPairs, status: 'queued', meta: { attempt: attempt + 1 } });
      emitProgress({ jobType: 'sync', type: 'requeue', jobId, shop, themeId, locale, message: `Requeued ${failedPairs.length} keys (attempt ${attempt + 1})`, progress: 100 });
    }

    await SyncJob.findByIdAndUpdate(jobId, { status: 'completed', progress: 100, totals: { total, success, failed } });
    emitProgress({ jobType: 'sync', type: 'complete', jobId, shop, themeId, locale, message: 'Sync completed', progress: 100, meta: { total, success, failed } });
  } catch (err) {
    await SyncJob.findByIdAndUpdate(jobId, { status: 'failed', error: err?.message || 'unknown error' });
    emitProgress({ jobType: 'sync', type: 'error', jobId, shop, themeId, locale, message: err?.message || 'sync failed', progress: 0 });
  }
}
