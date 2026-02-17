const mongoose = require("mongoose");

const clipboardSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  text: { type: String, required: true },
  tags: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tag",
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.Clipboard || mongoose.model("Clipboard", clipboardSchema);
