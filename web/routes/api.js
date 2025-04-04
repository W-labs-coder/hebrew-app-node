import express from "express";
import { submitCancellationRequest } from "../controllers/orderCancellationSubmissionController.js";
import { getStoreSettings } from "../controllers/storeSettingsController.js";

const router = express.Router();

router.post("/order-cancellation", submitCancellationRequest);
router.get("/store-settings", getStoreSettings); // New route to fetch store settings

export default router;
