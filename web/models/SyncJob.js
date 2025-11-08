import mongoose from "mongoose";

// Separate Shopify sync job that uploads translations to the store
const SyncJobSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, index: true },
    themeId: { type: String, required: true },
    locale: { type: String, required: true, default: 'he' },
    // When provided, only these keys will be synced (each item: { key, value })
    keys: { type: Array, default: [] },
    // Optional path to a prepared locale asset file (JSON)
    filePath: { type: String, default: '' },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'canceled'], default: 'queued', index: true },
    progress: { type: Number, default: 0 },
    totals: {
      total: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },
    error: { type: String, default: '' },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

SyncJobSchema.index({ shop: 1, status: 1 });

const SyncJob = mongoose.model('SyncJob', SyncJobSchema);

export default SyncJob;

