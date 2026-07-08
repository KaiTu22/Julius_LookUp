export default async function handler(req, res) {
  try {
    // Return hardcoded featured influencers (top creators across platforms)
    // These are fetched from the public Julius API on homepage load
    const featuredSlugs = [
      "cristiano-ronaldo",
      "lionel-messi",
      "selena-gomez",
      "kylie-jenner",
      "dwayne-johnson",
      "ariana-grande",
      "kim-kardashian",
      "taylor-swift",
      "beyonce",
      "justin-bieber",
      "oprah-winfrey",
      "bill-gates"
    ];

    // Get basic info for these influencers
    const influencers = featuredSlugs.map(slug => ({
      id: slug,
      slug: slug,
      display_name: slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      tagline: null,
      avatar: null,
      social_total_count: 0,
    }));

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
