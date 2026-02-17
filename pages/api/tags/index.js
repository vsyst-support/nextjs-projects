const dbConnect = require("../../../lib/db");
const Tag = require("../../../models/Tag");

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method === "POST") {
      const { name, color } = req.body || {};
      if (!name) return res.status(400).json({ error: "Tag name required" });

      const existing = await Tag.findOne({ name });
      if (existing) return res.json(existing);

      const tag = await Tag.create({ name, color });
      return res.json(tag);
    }

    if (req.method === "GET") {
      const tags = await Tag.find().sort({ name: 1 });
      return res.json(tags);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
