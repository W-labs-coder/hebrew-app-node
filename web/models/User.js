import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
    },
    selectedTheme: String,
    selectedLanguage: String,
    buyNowText: String,
    buyNowSize: String,
    font: String,
    selectedProcessors: [String],
    customProcessor: {},
    selectedFeatures: [String],
    shipping: String,
    customShipping: String,
    warranty: String,
    selectedCalendars: [String],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
