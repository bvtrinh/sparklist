const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const wishlist_schema = new Schema({
  name: {
    type: String,
    require: true
  },
  owner: {
    // type: Schema.Types.ObjectId,
    // ref: 'User',
    type: String,
    require: true
  },
  sharedUsers: [
    {
      // type: Schema.Types.ObjectId,
      // ref: 'User',
      type: String,
      require: false
    }
  ],
  items: [
    {
      item_id: {
        type: Schema.Types.ObjectId,
        ref: "item"
      },
      notify_price: { type: Number, require: false }
    }
  ],
  groups: [{ type: Schema.Types.ObjectId, ref: "group" }],
  visibility: {
    type: String,
    enum: ["public", "private"],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Wishlist = mongoose.model("wishlist", wishlist_schema);
