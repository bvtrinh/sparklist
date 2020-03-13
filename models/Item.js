const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const item_schema = new Schema({
  title: String,
  url: String,
  img_url: String,
  labels: Array,
  current_price: Number,
  price_hist: [{ price: Number, date: Date }],
  count: {
    type: Number,
    default: 1
  },
  category: String
});

module.exports = Item = mongoose.model("item", item_schema);
