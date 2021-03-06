const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const GroupSchema = new Schema({
  name: {
    type: String,
    require: true
  },
  admin: {
    type: String,
    require: true
  },
  members: {
    type: [String],
    require: false
  },
  wishlists: [{ type: Schema.Types.ObjectId, ref: "wishlist" }],
  visibility: {
    type: String,
    enum: ["public", "private"],
    require: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Group = mongoose.model("group", GroupSchema);
