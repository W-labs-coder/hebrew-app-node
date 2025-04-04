import User from "../models/User.js";

export const getStoreSettings = async (req, res) => {
  try {
    const userId = req.query.user_id; // Extract user_id from query parameters
    if (!userId) {
      return res.status(400).json({ message: "User ID parameter is required" });
    }

    const user = await User.findById(userId); // Find user by ID
    if (!user) {
      return res.status(404).json({ message: "Store not found" });
    }

    const settings = {
      termOfUseBgColor: user.termOfUseBgColor,
      termOfUseTextColor: user.termOfUseTextColor,
      termOfUseBtnBackgroundColor: user.termOfUseBtnBackgroundColor,
      termOfUseBtnTextColor: user.termOfUseBtnTextColor,
      pageTitle: user.pageTitle,
      termOfUseShortMessage: user.termOfUseShortMessage,
      termOfUseButtonText: user.termOfUseButtonText,
    };

    res.status(200).json(settings);
  } catch (error) {
    console.error("Error fetching store settings:", error);
    res.status(500).json({ message: "Failed to fetch store settings" });
  }
};
