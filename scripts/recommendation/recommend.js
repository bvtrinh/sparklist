"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
var recombee = require("recombee-api-client");
var rqs = recombee.requests;
var client = new recombee.ApiClient(
  process.env.RECOMBEE_NAME,
  process.env.RECOMBEE_KEY
);
const mongoose = require("mongoose");

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

// Add item and some properties of item to Recombee DB
async function addItemToDB() {
  // Add property columns
  client.send(
    new rqs.Batch([
      new rqs.AddItemProperty("title", "string"),
      new rqs.AddItemProperty("labels", "set"),
      new rqs.AddItemProperty("category", "string")
    ])
  );
  const items = await Item.find({});
  var requests = [];
  // Add item to DB
  items.forEach(item => {
    client.send(new rqs.AddItem(item._id));
    var itemId = item._id;
    var obj = {
      labels: item.labels,
      title: item.title,
      category: item.category
    };
    client.send(
      new rqs.RecommendItemsToItem(itemId, 4, {
        scenario: "ItemRecommendation"
      })
    );
    requests.push(new rqs.SetItemValues(itemId, obj, { cascadeCreate: true }));
  });
  return client.send(new rqs.Batch(requests));
}

// addItemToDB();

//  Get recommendations fromm Recombee DB
async function getRecom(itemID) {
  var recommendation = await client.send(
    new rqs.RecommendItemsToItem(itemID, null, 4, {
      scenarios: "ItemRecommendation",
      returnProperties: true
    })
  );
  var recomms = [];
  recommendation.recomms.forEach(item => {
    recomms.push(item.id);
  });
  return recomms;
}

async function updateRecomDB() {
  // Grab all the items from the Sparklist DB
  const items = await Item.find({});

  // Update ALL the items
  items.forEach(async item => {
    var recomms = await getRecom(item._id);

    // Update the recommendations for the item
    await Item.updateOne(
      { _id: item._id },
      { $set: { recommendations: recomms } }
    );
  });
}

async function test() {
  try {
    updateRecomDB();
  } catch (err) {
    console.log(err);
  }
}

test();
