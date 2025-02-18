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
    paymentBackgroundColor: String,
    selectedCalendars: [String],
    whatsappNumber: String,
    buttonLabel: String,
    whatsappPosition: String,
    whatsappStyle: String,
    whatsappText: String,
    buttonBgColor: String,
    buttonTextColor: String,
    buttonIconColor: String,
    includeProductDetails: String,
    enableWelcomeMessage: {
      type: Boolean,
      default: false
    },
    welcomeMessage: {
      type: String,
      default: 'היי! איך אפשר לעזור היום?'
    },
    messageFrequency: {
      type: Number,
      default: 1
    },
    messageDelay: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
