import mongoose from "mongoose";

// Stores translations of unique source strings per locale to avoid repeat work
// Key is a stable hash of (locale + normalized + masked source).
const TranslationMemorySchema = new mongoose.Schema(
  {
    sourceHash: { type: String, required: true, index: true, unique: true },
    locale: { type: String, required: true, index: true },
    source: { type: String, required: true },
    translation: { type: String, required: true },
  },
  { timestamps: true }
);

// Secondary compound index to support queries by locale + sourceHash
TranslationMemorySchema.index({ locale: 1, sourceHash: 1 }, { unique: true });

const TranslationMemory = mongoose.model("TranslationMemory", TranslationMemorySchema);

export default TranslationMemory;

