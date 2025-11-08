import mongoose from "mongoose";

// Tracks per-key sync status for a given shop/theme/locale
const TranslationKeyStatusSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, index: true },
    themeId: { type: String, required: true, index: true },
    locale: { type: String, required: true, default: 'he', index: true },
    key: { type: String, required: true },
    status: { type: String, enum: ['pending', 'synced', 'failed', 'requeued'], default: 'pending', index: true },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);

TranslationKeyStatusSchema.index({ shop: 1, themeId: 1, locale: 1, key: 1 }, { unique: true });

const TranslationKeyStatus = mongoose.model('TranslationKeyStatus', TranslationKeyStatusSchema);

export default TranslationKeyStatus;

