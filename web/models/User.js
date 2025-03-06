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
  }
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema(
  {
    shop: {
      type: String,
      required: true,
      unique: true
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
    shipping: String,
    customShipping: String,
    warranty: String,
    paymentBackgroundColor: String,
    selectedCalendars: [String],
    whatsappNumber: String,
    buttonLabel: {
      type: String,
      default: "צור קשר"
    },
    whatsappPosition: {
      type: String,
      enum: ["left", "right"],
      default: "right"
    },
    whatsappStyle: {
      type: String,
      enum: ["text_and_icon", "icon"],
      default: "text_and_icon"
    },
    buttonBgColor: {
      type: String,
      default: "#25D366"
    },
    buttonTextColor: {
      type: String,
      default: "#FFFFFF"
    },
    buttonIconColor: {
      type: String,
      default: "#FFFFFF"
    },
    includeProductDetails: {
      type: Boolean,
      default: false
    },
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
    },
    enableDefaultMessage: {
      type: Boolean,
      default: false
    },
    defaultMessage: {
      type: String,
      default: ''
    },
    enableWidget: {
      type: Boolean,
      default: false
    },
    titleBgColor: {
      type: String,
      default: "#05B457"  // Add default value to match controller
    },
    titleTextColor: {
      type: String,
      default: "#FFFFFF"  // Add default value to match controller
    },
    contacts: [contactSchema],
    
    // Add Sabbath settings
    isSabbathMode: {
      type: Boolean,
      default: false
    },
    isAutoSabbathMode: {
      type: Boolean,
      default: false
    },
    closingDay: {
      type: String,
      enum: ['Friday', 'Saturday'],
      default: 'Friday'
    },
    openingDay: {
      type: String,
      enum: ['Saturday', 'Sunday'],
      default: 'Saturday'
    },
    closingTime: {
      type: String,
      default: '00:00'
    },
    openingTime: {
      type: String,
      default: '00:00'
    },
    sabbathFile: String,
    bannerText: {
      type: String,
      default: ''
    },
    socialLinks: [{
      type: String
    }],
    bannerBgColor: {
      type: String,
      default: '#FFFFFF'
    },
    bannerTextColor: {
      type: String,
      default: '#000000'
    }
  },
  { timestamps: true }
);

// Add any necessary indexes
// userSchema.index({ shop: 1 });
// userSchema.index({ 'contacts.phone': 1 });

const User = mongoose.model("User", userSchema);

export default User;
