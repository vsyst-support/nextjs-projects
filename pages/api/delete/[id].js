const dbConnect = require("../../../lib/db");
const Clipboard = require("../../../models/Clipboard");

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { id } = req.query;
    const deleted = await Clipboard.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Clipboard not found" });
    return res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};
