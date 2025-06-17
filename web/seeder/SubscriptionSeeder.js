import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";
import * as dotenv from 'dotenv'

dotenv.config()

mongoose.connect(
  process.env.MONGO_URI ||
    "mongodb+srv://emmyconceptng:5FAes7qL0JjICpm2@hebrew-app.sxmin.mongodb.net/?retryWrites=true&w=majority&appName=hebrew-app"
);

const subscriptions = [
  {
    id: 1,
    name: "Basic",
    amount: 6.75,
    duration: "monthly",

    features: [
      "יישור מימין לשמאל (RTL)",
      "תרגום לעברית",
      "פונטים בעברית",
      "שינוי טקסט לכפתור 'Buy now'",
      "תרגום התראות ",
      "אייקונים לאמצעי תשלום",
      "מוד שבת",
      "כפתור WhatsApp",
      "שירות, תמיכה וסרטוני הדרכה",
    ],

    permissions: [
      "dashboard",
      "rtl",
      "language",
      "fonts",
      "buyNowText",
      "notifications",
      "payment",
      "sabbathMode",
      "whatsapp",
      "support",
    ],
  },
  {
    id: 2,
    name: "Basic",
    amount: 65,
    duration: "yearly",
    features: [
      "יישור מימין לשמאל (RTL)",
      "תרגום לעברית",
      "פונטים בעברית",
      "שינוי טקסט לכפתור Buy now'",
      "תרגום התראות ",
      "אייקונים לאמצעי תשלום",
      "מוד שבת",
      "כפתור WhatsApp",
      "שירות, תמיכה וסרטוני הדרכה",
    ],
    permissions: [
      "dashboard",
      "rtl",
      "language",
      "fonts",
      "buyNowText",
      "notifications",
      "payment",
      "sabbathMode",
      "whatsapp",
      "support",
    ],
  },
  {
    id: 3,
    name: "Pro",
    amount: 8.75,
    duration: "monthly",
    features: [
      "כל אפשרויות חבילת ה-Basic",
      "מוד שבת בהתאמה אישית ",
      "מדיניות ביטול עסקה",
      "כפתור והצהרת נגישות בהתאמה אישית",
      "שירות, תמיכה וסרטוני הדרכה",
    ],
    permissions: [
      "dashboard",
      "rtl",
      "language",
      "fonts",
      "buyNowText",
      "notifications",
      "payment",
      "shabbatMode",
      "customSabbathMode",
      "whatsapp",
      "support",
      "transactionPolicy",
      "accessibility",
    ],
  },
  {
    id: 4,
    name: "Pro",
    amount: 145,
    duration: "yearly",
    features: [
      "כל אפשרויות חבילת ה-Basic",
      "מוד שבת בהתאמה אישית ",
      "מדיניות ביטול עסקה",
      "כפתור והצהרת נגישות בהתאמה אישית",
      "שירות, תמיכה וסרטוני הדרכה",
    ],
    permissions: [
      "dashboard",
      "rtl",
      "language",
      "fonts",
      "buyNowText",
      "notifications",
      "payment",
      "shabbatMode",
      "customSabbathMode",
      "whatsapp",
      "support",
      "transactionPolicy",
      "accessibility",
    ],
  },
  {
    id: 5,
    name: "Premium",
    amount: 14.75,
    duration: "monthly",
    features: [
      "כל אפשרויות חבילת ה-Basic",
      "כל אפשרויות חבילת ה-Pro",
      "איתור מיקוד אוטומטי (לישראל)",
      "שירות, תמיכה וסרטוני הדרכה",
    ],
    permissions: [
      "dashboard",
      "rtl",
      "language",
      "fonts",
      "buyNowText",
      "notifications",
      "payment",
      "shabbatMode",
      "customSabbathMode",
      "whatsapp",
      "support",
      "transactionPolicy",
      "accessibility",
      "zipCode",
    ],
  },
  {
    id: 6,
    name: "Premium",
    amount: 84,
    duration: "yearly",
    features: [
      "כל אפשרויות חבילת ה-Basic",
      "כל אפשרויות חבילת ה-Pro",
      "איתור מיקוד אוטומטי (לישראל)",
      "שירות, תמיכה וסרטוני הדרכה",
    ],
    permissions: [
      "dashboard",
      "rtl",
      "language",
      "fonts",
      "buyNowText",
      "notifications",
      "payment",
      "shabbatMode",
      "customSabbathMode",
      "whatsapp",
      "support",
      "transactionPolicy",
      "accessibility",
      "zipCode",
    ],
  },
];

const seedDB = async () => {
  await Subscription.deleteMany({});
  await Subscription.insertMany(subscriptions);
  console.log("Database seeded!");
  mongoose.connection.close();
};

seedDB();
