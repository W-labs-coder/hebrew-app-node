import express from 'express';
import TranslationJob from '../models/TranslationJob.js';

const router = express.Router();

// Create a new translation job for current shop
router.post('/jobs', async (req, res) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const locale = (req.body?.locale || 'he').toLowerCase();
    const job = await TranslationJob.create({ shop: session.shop, locale, status: 'queued' });
    res.status(201).json({ success: true, id: job._id, status: job.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get job status
router.get('/jobs/:id', async (req, res) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const job = await TranslationJob.findById(req.params.id).lean();
    if (!job || job.shop !== session.shop) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cancel a job
router.post('/jobs/:id/cancel', async (req, res) => {
  try {
    const session = res.locals.shopify?.session;
    if (!session?.shop) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const job = await TranslationJob.findById(req.params.id);
    if (!job || job.shop !== session.shop) return res.status(404).json({ success: false, message: 'Not found' });
    if (['completed', 'failed', 'canceled'].includes(job.status)) {
      return res.json({ success: true, status: job.status });
    }
    job.status = 'canceled';
    await job.save();
    res.json({ success: true, status: job.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

