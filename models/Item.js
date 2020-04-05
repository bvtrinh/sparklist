const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const item_schema = new Schema({
  title: String,
  url: String,
  price_url: String,
  img_url: String,
  labels: Array,
  current_price: Number,
  price_hist: [{ price: Number, date: Date }],
  count: {
    type: Number,
    default: 0,
  },
  category: String,
  recommendations: [{ type: Schema.Types.ObjectId, ref: "item" }],
});

module.exports = Item = mongoose.model("item", item_schema);
