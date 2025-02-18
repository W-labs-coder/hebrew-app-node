import express from "express";
import { addSelectedTheme, fetchTheme } from "../controllers/themesController.js";
import { addSelectedLanguage } from "../controllers/languagesController.js";
import { addBuyNow, fetchUser } from "../controllers/buyNowController.js";
import { addFont } from "../controllers/fontController.js";
import { updatePaymentSettings } from "../controllers/paymentController.js";
import { updateWhatsappSettings } from "../controllers/whatsappController.js";

const router = express.Router();


router.get("/get-themes", fetchTheme);
router.post("/add-selected-theme", addSelectedTheme);
router.post("/add-selected-language", addSelectedLanguage);
router.post("/add-buy-now", addBuyNow);
router.post("/add-font", addFont);
router.post("/update-payment-settings", updatePaymentSettings);
router.post("/fetch-user", fetchUser);
router.post("/update-whatsapp-settings", updateWhatsappSettings);



export default router;
