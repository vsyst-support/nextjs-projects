const dbConnect = require("../../lib/db");
const Clipboard = require("../../models/Clipboard");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { title, text, tagIds } = req.body || {};
    if (!text) return res.status(400).json({ error: "Text required" });

    const clipboard = await Clipboard.create({
      title: title || "",
      text,
      tags: tagIds || [],
    });

    return res.json(clipboard);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
