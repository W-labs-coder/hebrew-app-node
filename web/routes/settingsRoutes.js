import express from "express";
import { addSelectedTheme, fetchTheme } from "../controllers/themesController.js";
import { addSelectedLanguage } from "../controllers/languagesController.js";
import { addBuyNow, fetchUser } from "../controllers/buyNowController.js";
import { addFont } from "../controllers/fontController.js";

const router = express.Router();


router.get("/get-themes", fetchTheme);
router.post("/add-selected-theme", addSelectedTheme);
router.post("/add-selected-language", addSelectedLanguage);
router.post("/add-buy-now", addBuyNow);
router.post("/add-font", addFont);
router.post("/fetch-user", fetchUser);



export default router;
