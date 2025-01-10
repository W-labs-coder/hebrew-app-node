import express from "express";
import { addSelectedTheme, fetchTheme } from "../controllers/themesController.js";
import { addSelectedLanguage } from "../controllers/languagesController.js";
import { addBuyNow } from "../controllers/buyNowController.js";

const router = express.Router();


router.get("/get-themes", fetchTheme);
router.post("/add-selected-theme", addSelectedTheme);
router.post("/add-selected-language", addSelectedLanguage);
router.post("/add-buy-now", addBuyNow);



export default router;
