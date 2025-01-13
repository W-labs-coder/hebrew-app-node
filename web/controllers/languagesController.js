import User from "../models/User.js";




export const addSelectedLanguage = async (req, res) => {
  try {
    const { language } = req.body;
     const session = res.locals.shopify.session;

     if (!session) {
       return res
         .status(401)
         .json({ error: "Unauthorized: Session not found" });
     }


     const shopId = session.shop

    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { selectedLanguage: language } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Language added successfully", user });
  } catch (error) {
    console.error("Error adding language:", error);
    res.status(500).json({ message: "Error adding language" });
  }
};