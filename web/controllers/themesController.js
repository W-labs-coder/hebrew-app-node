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
