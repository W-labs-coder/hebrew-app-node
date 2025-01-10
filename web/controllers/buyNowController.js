import User from "../models/User.js";
import shopify from "../shopify.js";


export const addBuyNow = async (req, res) => {
  try {
    const { buyNowSize, buyNowText } = req.body;
     const session = res.locals.shopify.session;

     if (!session) {
       return res
         .status(401)
         .json({ error: "Unauthorized: Session not found" });
     }


     const shopId = session.shop

    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { buyNowText, buyNowSize } },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Buy Now Details Updated successfully", user });
  } catch (error) {
    console.error("Error adding buy now details:", error);
    res.status(500).json({ message: "Error adding buy now details" });
  }
};