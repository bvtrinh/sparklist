const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Models for featured items
const Item = require("../../models/Item");

// Connect to Mongo
mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => console.log(err));

// Item categories
const categories = {
  Books: ["Text", "Font", "Poster", "Magazine", "Book cover"],
  Clothing: ["Clothing"],
  Electronics: ["Technology", "Electronic device", "Gadget"],
  "Home and Kitchen": [
    "Home appliance",
    "Kitchen appliance",
    "Small appliance"
  ],
  Movie: ["Movie", "Poster", "Hero"],
  "Sports Equipment": ["Sports equipment", "Sports gear", "Helmet"],
  Tools: ["Tool"],
  "Video Games": ["Video game software", "Games", "Pc game"]
};

async function getCategory(labels, category = "Other") {
  let ratings = {
    Books: 0,
    Clothing: 0,
    Electronics: 0,
    "Home and Kitchen": 0,
    Movie: 0,
    "Sports Equipment": 0,
    Tools: 0,
    "Video Games": 0
  };

  // The case where we are using the Amazon Price Finder package
  // Sometimes will return a accurate category
  if (category !== "Other") return category;

  // Test all categories
  for (let [key, value] of Object.entries(categories)) {
    let matchedTerms = labels.filter(term => {
      return value.includes(term);
    });

    ratings[key] = matchedTerms.length;
  }

  // Find the category with the max value
  let maxTerm;
  let maxVal = 0;
  for (let [key, value] of Object.entries(ratings)) {
    if (value > maxVal) {
      maxVal = value;
      maxTerm = key;
    }
  }

  // If no terms match then categorize as Other
  if (maxVal === 0) return "Other";

  return maxTerm;
}

async function updateCategory() {
  const results = await Item.find({});

  for (var i = 0; i < results.length; i++) {
    var category = await getCategory(results[i].labels);
    await Item.updateOne(
      { _id: results[i]._id },
      { $set: { category: category } }
    );
  }
}
try {
  updateCategory();
} catch (err) {
  console.log(err);
}
