const strSimilar = require("string-similarity");
const Item = require("../../models/Item");

// When using this in a the web app we shouldn't need this
// const path = require("path");
// const mongoose = require("mongoose");
// require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// // Connect to Mongo
// mongoose
//   .connect(process.env.MONGOURI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
//   })
//   .then(() => console.log("MongoDB Connected..."))
//   .catch(err => console.log(err));

const test = async mainStr => {
  // Make database call to get all items
  var items = await Item.find({}, { title: 1 });
  var bestRating = 0;
  var currRating;
  var bestMatchItem;

  // Find an item with the highest confidence similarity
  items.forEach(item => {
    currRating = strSimilar.compareTwoStrings(mainStr, item.title);
    if (currRating > bestRating) {
      bestRating = currRating;
      bestMatchItem = item;
    }
  });

  // If the best match has a low confidence level then don't use it
  console.log(bestRating);
  if (bestRating < 0.5) return -1;

  return bestMatchItem;
};

module.exports = { test };
