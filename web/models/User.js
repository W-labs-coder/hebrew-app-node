import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v.replace(/\s+/g, ''));
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  avatar_url: { type: String, default: "" } // <-- Add this line
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      unique: true,
    },
    selectedTheme: String,
    originalTheme: String, // Add this field
    selectedLanguage: String,
    buyNowText: String,
    buyNowSize: String,
    font: String,
    selectedProcessors: [String],
    customProcessor: {},
    selectedFeatures: [String],
    hasFreeShipping: Boolean,
    freeShippingText: String,
    warranty: String,
    paymentBackgroundColor: String,
    selectedCalendars: [String],
    whatsappNumber: String,
    buttonLabel: {
      type: String,
      default: "צור קשר",
    },
    whatsappPosition: {
      type: String,
      enum: ["left", "right"],
      default: "right",
    },
    whatsappStyle: {
      type: String,
      enum: ["text_and_icon", "icon"],
      default: "text_and_icon",
    },
    buttonBgColor: {
      type: String,
      default: "#25D366",
    },
    buttonTextColor: {
      type: String,
      default: "#FFFFFF",
    },
    buttonIconColor: {
      type: String,
      default: "#FFFFFF",
    },
    includeProductDetails: {
      type: Boolean,
      default: false,
    },
    enableWelcomeMessage: {
      type: Boolean,
      default: false,
    },
    welcomeMessage: {
      type: String,
      default: "היי! איך אפשר לעזור היום?",
    },
    messageFrequency: {
      type: Number,
      default: 1,
    },
    messageDelay: {
      type: Number,
      default: 0,
    },
    enableDefaultMessage: {
      type: Boolean,
      default: false,
    },
    defaultMessage: {
      type: String,
      default: "",
    },
    enableWidget: {
      type: Boolean,
      default: false,
    },
    titleBgColor: {
      type: String,
      default: "#05B457", // Add default value to match controller
    },
    titleTextColor: {
      type: String,
      default: "#FFFFFF", // Add default value to match controller
    },
    contacts: [contactSchema],

    // Add Sabbath settings
    isSabbathMode: {
      type: Boolean,
      default: false,
    },
    isAutoSabbathMode: {
      type: Boolean,
      default: false,
    },
    closingDay: {
      type: String,
      enum: ["Friday", "Saturday"],
      default: "Friday",
    },
    openingDay: {
      type: String,
      enum: ["Saturday", "Sunday"],
      default: "Saturday",
    },
    closingTime: {
      type: String,
      default: "00:00",
    },
    openingTime: {
      type: String,
      default: "00:00",
    },
    sabbathFile: String,
    bannerText: {
      type: String,
      default: "",
    },
    socialLinks: [
      {
        type: String,
      },
    ],
    bannerBgColor: {
      type: String,
      default: "#FFFFFF",
    },
    bannerTextColor: {
      type: String,
      default: "#000000",
    },
    notifications: {
      type: Map,
      of: {
        subject: String,
        template: String,
        updatedAt: Date,
      },
      default: {},
    },
    iconLocation: { type: String, default: "bottom_right" },
    iconShape: { type: String, default: "rounded" },
    iconSize: { type: String, default: "medium" },
    iconType: { type: String, default: "default" },
    helpTitle: { type: String, default: "כלי נגישות" },
    helpText: { type: String, default: "" },
    ownerEmail: { type: String, default: "" },
    leftIconSpacing: { type: Number, default: 20 },
    topBottomSpacing: { type: Number, default: 20 },
    zIndex: { type: Number, default: 999 },
    autofocusDetection: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "disabled",
    },
    autofocusCorrection: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "disabled",
    },
    // Transaction Cancellation Settings
    transactionCancellation: {
      type: String,
      enum: ["enabled", "disabled"],
      default: "disabled",
    },
    email: String,
    termOfUse: String,
    linkTermOfUseWebsite: String,
    cancellationConditions: String,
    termOfUseBgColor: {
      type: String,
      default: "#FFFFFF",
    },
    termOfUseTextColor: {
      type: String,
      default: "#000000",
    },
    termOfUseBtnBackgroundColor: {
      type: String,
      default: "#021341",
    },
    termOfUseBtnTextColor: {
      type: String,
      default: "#FFFFFF",
    },
    pageTitle: {
      type: String,
      default: "ביטול עסקה",
    },
    titleOfCancellationCondition: {
      type: String,
      default: "תנאי ביטול עסקה",
    },
    formTitle: {
      type: String,
      default: "טופס ביטול עסקה",
    },
    termOfUseButtonText: {
      type: String,
      default: "לצפייה בתנאי השימוש של האתר",
    },
    termOfUseFullName: {
      type: String,
      default: "",
    },
    termOfUseEmail: {
      type: String,
      default: "דואר אלקטרוני",
    },
    termOfUsePhone: {
      type: String,
      default: "מספר טלפון",
    },
    orderNumberField: {
      type: String,
      default: "מספר הזמנה",
    },
    termOfUseShortMessage: String,
    accessibilityButtonBgColor:String,
    accessibilityButtonTextColor:String,
    accessibilityButtonIconColor:String,
    timezone: { type: String, default: "" },
  },
  { timestamps: true }
);

// Add any necessary indexes
// userSchema.index({ shop: 1 });
// userSchema.index({ 'contacts.phone': 1 });

const User = mongoose.model("User", userSchema);

export default User;
