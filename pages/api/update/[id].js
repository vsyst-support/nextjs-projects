const dbConnect = require("../../../lib/db");
const Clipboard = require("../../../models/Clipboard");

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { title, text, tagIds } = req.body || {};

    const updated = await Clipboard.findByIdAndUpdate(
      req.query.id,
      { title, text, tags: tagIds },
      { new: true },
    );

    return res.json(updated);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
