import express from 'express';
import TranslationJob from '../models/TranslationJob.js';
import { progressBus } from '../services/progressBus.js';

const router = express.Router();

// Create a new translation job for current shop
router.post('/jobs', async (req, res) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop) return res.status(401).json({ success: false, message: 'Unauthorized', dev: 'ife' });

    const locale = (req.body?.locale || 'he').toLowerCase();
    const job = await TranslationJob.create({ shop: session.shop, locale, status: 'queued' });
    res.status(201).json({ success: true, id: job._id, status: job.status, dev: 'ife' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, dev: 'ife' });
  }
});

// Get job status
router.get('/jobs/:id', async (req, res) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop) return res.status(401).json({ success: false, message: 'Unauthorized', dev: 'ife' });

    const job = await TranslationJob.findById(req.params.id).lean();
    if (!job || job.shop !== session.shop) return res.status(404).json({ success: false, message: 'Not found', dev: 'ife' });
    res.json({ success: true, job, dev: 'ife' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, dev: 'ife' });
  }
});

// Cancel a job
router.post('/jobs/:id/cancel', async (req, res) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop) return res.status(401).json({ success: false, message: 'Unauthorized', dev: 'ife' });

    const job = await TranslationJob.findById(req.params.id);
    if (!job || job.shop !== session.shop) return res.status(404).json({ success: false, message: 'Not found', dev: 'ife' });
    if (['completed', 'failed', 'canceled'].includes(job.status)) {
      return res.json({ success: true, status: job.status, dev: 'ife' });
    }
    job.status = 'canceled';
    await job.save();
    res.json({ success: true, status: job.status, dev: 'ife' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, dev: 'ife' });
  }
});

export default router;

// SSE progress stream (mounted path controls access)
router.get('/progress', async (req, res) => {
  try {
    const live = (process.env.ENABLE_LIVE_PROGRESS || '').toLowerCase();
    const enabled = ['1','true','yes','on','y'].includes(live);
    if (!enabled) return res.status(404).end();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders && res.flushHeaders();

    const onEvent = (evt) => {
      try { res.write(`data: ${JSON.stringify(evt)}\n\n`); } catch (_) {}
    };
    progressBus.on('progress', onEvent);

    req.on('close', () => {
      progressBus.off('progress', onEvent);
    });
  } catch (err) {
    res.status(500).end();
  }
});
