// middleware.js
export const verifyShopifySession = async (req, res, next) => {
  try {
    const session = await res.locals.shopify.session;
    if (!session || !session.shop) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Missing session or shop information." });
    }
    next();
  } catch (error) {
    console.error("Error in verifyShopifySession middleware:", error);
    res.status(401).json({ error: "Unauthorized: Unable to load session." });
  }
};
