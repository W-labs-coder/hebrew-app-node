import mongoose from "mongoose";

const TranslationJobSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, index: true },
    locale: { type: String, required: true, default: 'he' },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'canceled'], default: 'queued', index: true },
    progress: { type: Number, default: 0 }, // 0-100
    totals: {
      themes: { type: Number, default: 0 },
      processedThemes: { type: Number, default: 0 },
      strings: { type: Number, default: 0 },
      uniqueStrings: { type: Number, default: 0 },
      cacheHits: { type: Number, default: 0 },
      providerCalls: { type: Number, default: 0 },
    },
    results: [{ theme: String, file: String, uniqueItems: Number, totalItems: Number, error: String }],
    error: { type: String, default: '' },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

const TranslationJob = mongoose.model('TranslationJob', TranslationJobSchema);

export default TranslationJob;

