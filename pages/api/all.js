const dbConnect = require("../../lib/db");
const Clipboard = require("../../models/Clipboard");

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const allTexts = await Clipboard.find()
      .sort({ createdAt: -1 })
      .populate("tags")
      .lean();

    allTexts.forEach((c) => {
      c.tags = (c.tags || []).filter((t) => t);
    });

    return res.json(allTexts);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
