import express from "express";
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { addSelectedTheme, fetchTheme } from "../controllers/themesController.js";
import { addSelectedLanguage } from "../controllers/languagesController.js";
import { addBuyNow, fetchUser } from "../controllers/buyNowController.js";
import { addFont } from "../controllers/fontController.js";
import { updatePaymentSettings } from "../controllers/paymentController.js";
import {
  updateWhatsappSettings,
  addOrUpdateWhatsappContact,
  deleteWhatsappContact,
 } from "../controllers/whatsappController.js";
import {
  updateSabbathSettings,
  uploadSabbathFile,
  getUploadUrl,
  getImageUrl,
  toggleSabbathTheme,
  getSabbathSettings,
} from "../controllers/sabbathController.js";
import { r2Client } from '../config/r2.js';
import { v4 as uuidv4 } from "uuid";
import { generateNotificationContent, updateNotification } from "../controllers/notificationsController.js";
import { updateAccessibilitySettings } from "../controllers/accessibilityController.js";
import { updatePostalSettings } from "../controllers/postalController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function(req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf|xlsx/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images, PDFs, and Excel files are allowed'));
  }
});

const router = express.Router();

router.get("/get-themes", fetchTheme);
router.post("/add-selected-theme", addSelectedTheme);
router.post("/add-selected-language", addSelectedLanguage);
router.post("/add-buy-now", addBuyNow);
router.post("/add-font", addFont);
router.post("/update-payment-settings", updatePaymentSettings);
router.post("/fetch-user", fetchUser);
router.post("/update-whatsapp-settings", updateWhatsappSettings);
router.post("/whatsapp/contacts", addOrUpdateWhatsappContact);
router.delete("/whatsapp/contacts/:id", deleteWhatsappContact);
router.post("/update-sabbath", updateSabbathSettings);
router.post("/toggle-sabbath-theme", toggleSabbathTheme);
router.get("/get-sabbath", getSabbathSettings);

// Add the new file upload route
router.post("/upload-sabbath-file", upload.single('file'), uploadSabbathFile);

router.post("/generate-notification", generateNotificationContent);
router.post("/update-notification", updateNotification);

router.post("/get-upload-url", getUploadUrl);
router.get("/get-image-url/:imageId", getImageUrl);

router.post("/update-accessibility-settings", updateAccessibilitySettings);

router.post(
  '/update-postal-settings',
  updatePostalSettings
);


export default router;
