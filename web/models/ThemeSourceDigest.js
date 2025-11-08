import mongoose from "mongoose";

// Stores the last known digests of translatable keys for a theme
// Use Shopify-provided `digest` to detect source changes without re-translating
const ThemeSourceDigestSchema = new mongoose.Schema(
  {
    shop: { type: String, required: true, index: true },
    themeId: { type: String, required: true, index: true },
    locale: { type: String, default: 'en', index: true },
    digests: { type: Map, of: String, default: {} }, // key => digest
  },
  { timestamps: true }
);

ThemeSourceDigestSchema.index({ shop: 1, themeId: 1, locale: 1 }, { unique: true });

const ThemeSourceDigest = mongoose.model('ThemeSourceDigest', ThemeSourceDigestSchema);

export default ThemeSourceDigest;

