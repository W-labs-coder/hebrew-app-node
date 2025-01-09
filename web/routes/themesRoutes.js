import express from "express";
import { fetchTheme } from "../controllers/themesController.js";

const router = express.Router();


router.get("/get-themes", fetchTheme);



export default router;
