const dbConnect = require("../../../lib/db");
const Tag = require("../../../models/Tag");

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method === "PUT") {
      const { name, color } = req.body || {};
      const tag = await Tag.findByIdAndUpdate(
        req.query.id,
        { name, color },
        { new: true },
      );
      return res.json(tag);
    }

    if (req.method === "DELETE") {
      await Tag.findByIdAndDelete(req.query.id);
      return res.json({ success: true });
    }

    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
