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
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
