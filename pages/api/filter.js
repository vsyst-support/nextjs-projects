const mongoose = require("mongoose");
const dbConnect = require("../../lib/db");
const Clipboard = require("../../models/Clipboard");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await dbConnect();
    const { tagIds = [], startDate, endDate, sortBy } = req.body || {};

    const query = {};

    if (tagIds.length > 0) {
      query.tags = { $in: tagIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    let sort = { createdAt: -1 };
    switch (sortBy) {
      case "date_asc":
        sort = { createdAt: 1 };
        break;
      case "alpha_asc":
        sort = { text: 1 };
        break;
      case "alpha_desc":
        sort = { text: -1 };
        break;
      case "date_desc":
      default:
        sort = { createdAt: -1 };
    }

    const filtered = await Clipboard.find(query)
      .sort(sort)
      .populate("tags")
      .lean();

    filtered.forEach((c) => {
      c.tags = (c.tags || []).filter((t) => t);
    });

    return res.json(filtered);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
