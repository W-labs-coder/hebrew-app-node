import User from "../models/User.js";
import UserSubscription from "../models/UserSubscription.js";
import shopify from "../shopify.js";

export const fetchTheme = async (req, res) => {
  try {
    const session = res.locals.shopify.session;

    if (!session) {
      return res.status(401).json({ error: "Unauthorized: Session not found" });
    }

    const client = new shopify.api.clients.Graphql({ session });

    let themes = [];
    let hasNextPage = true;
    let endCursor = null;

    while (hasNextPage) {
      // Execute the query with pagination
      const data = await client.query({
        data: `query {
          themes(first: 250${endCursor ? `, after: "${endCursor}"` : ""}) {
            edges {
              node {
                name
                id
                role
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }`,
      });

      // Extract themes and pagination info
      const themesData = data.body.data.themes.edges.map((edge) => edge.node);
      themes = [...themes, ...themesData];

      hasNextPage = data.body.data.themes.pageInfo.hasNextPage;
      endCursor = data.body.data.themes.pageInfo.endCursor;
    }

    // Respond with the themes
    res.status(200).json({ themes });
  } catch (error) {
    console.error("Error fetching themes:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch themes", details: error.message });
  }
};



export const addSelectedTheme = async (req, res) => {
  try {
    const { themeId } = req.body;
     const session = res.locals.shopify.session;

     if (!session) {
       return res
         .status(401)
         .json({ error: "Unauthorized: Session not found" });
     }


     const shopId = session.shop

    const user = await User.findOneAndUpdate(
      { shop: shopId },
      { $set: { selectedTheme: themeId } },
      { new: true, upsert: true }
    );

    const subscription = await UserSubscription.findOne({ shop }).sort({ createdAt: -1 }).populate("subscription");
    
        if (!subscription) {
          return res.status(404).json({ success: false, message: "No subscription found" });
        }
    
        const currentDate = new Date();
    
        if (currentDate > subscription.endDate) {
          return res.status(403).json({ 
            success: false, 
            message: "Subscription has expired" 
          });
        }

    res.status(200).json({ message: "Theme added successfully", user, subscription });
  } catch (error) {
    console.error("Error adding theme:", error);
    res.status(500).json({ message: "Error adding theme" });
  }
};