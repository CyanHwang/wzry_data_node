const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  name: { type: String },
  icon: { type: String },
  // parent: { type: mongoose.SchemaTypes.ObjectId, ref: "Category" },
});

module.exports = mongoose.model("Item", schema);
