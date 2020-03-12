const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create schema
const item_schema = new Schema({
  title: String,
  url: String,
  img_url: String,
  labels: Array,
  price_hist: [{ price: Number, date: Date }],
  count: Number,
  category: String
});

module.exports = Item = mongoose.model("item", item_schema);
