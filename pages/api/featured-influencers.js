export default async function handler(req, res) {
  try {
    // Return featured influencers directly from known archive data
    const influencers = [
      {
        id: "cristiano-ronaldo",
        slug: "cristiano-ronaldo",
        display_name: "Cristiano Ronaldo",
        tagline: null,
        avatar: { url: "https://assets.julius.cloud/influencers/2020-07-16-142243-002-68370535-10157524021292164-2508255635234095104-o.jpg" },
        social_total_count: "1041926343",
      },
      {
        id: "selena-gomez",
        slug: "selena-gomez",
        display_name: "Selena Gomez",
        tagline: null,
        avatar: { url: "https://assets.julius.cloud/influencers/2020-07-06-200047-002-82940549-10156952642670975-7287561067444568064-o.jpg" },
        social_total_count: "677355330",
      },
      {
        id: "justin-bieber",
        slug: "justin-bieber",
        display_name: "Justin Bieber",
        tagline: null,
        avatar: { url: "https://social.julius.cloud/influencers/person-82552/account-4294048/instagram-2026-6.jpg" },
        social_total_count: "633133536",
      },
      {
        id: "lionel-messi",
        slug: "lionel-messi",
        display_name: "Lionel Messi",
        tagline: null,
        avatar: { url: "https://social.julius.cloud/influencers/person-85794/account-27210/instagram-2026-6.jpg" },
        social_total_count: "629359906",
      },
      {
        id: "taylor-swift",
        slug: "taylor-swift",
        display_name: "Taylor Swift",
        tagline: null,
        avatar: { url: "https://assets.julius.cloud/influencers/2020-06-25-184224-004-esnkzy2v.jpg" },
        social_total_count: "567950657",
      },
      {
        id: "kylie-jenner",
        slug: "kylie-jenner",
        display_name: "Kylie Jenner",
        tagline: null,
        avatar: null,
        social_total_count: 0,
      },
      {
        id: "dwayne-johnson",
        slug: "dwayne-johnson",
        display_name: "Dwayne Johnson",
        tagline: null,
        avatar: null,
        social_total_count: 0,
      },
      {
        id: "ariana-grande",
        slug: "ariana-grande",
        display_name: "Ariana Grande",
        tagline: null,
        avatar: null,
        social_total_count: 0,
      },
      {
        id: "kim-kardashian",
        slug: "kim-kardashian",
        display_name: "Kim Kardashian",
        tagline: null,
        avatar: null,
        social_total_count: 0,
      },
    ];

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ influencers });
  } catch (err) {
    console.error("Featured influencers error:", err);
    return res.status(200).json({ influencers: [] });
  }
}
