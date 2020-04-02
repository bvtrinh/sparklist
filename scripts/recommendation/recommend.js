"use strict";

var recombee = require('recombee-api-client');
var rqs = recombee.requests;
var client = new recombee.ApiClient('sparklist-dev', 'NCm0lEkQpN0wQwiE3RyzwcMc53xviN3qjlz12lnWuMEF2pG50KBUmGrRO3ZYMQqi');
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config(path.join(__dirname, "./.env"));

// Models for featured items
const Item = require("../../models/Item");

// Connect to Mongo
mongoose.connect(process.env.MONGOURI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then(() => console.log("MongoDB Connected..."))
    .catch(err => console.log(err));

// Add item and some properties of item to Recombee DB
async function addItemToDB() {
    // Add property columns
    client.send(new rqs.Batch([
        new rqs.AddItemProperty('title', 'string'),
        new rqs.AddItemProperty('count', 'int'),
        new rqs.AddItemProperty('labels', 'set'),
        new rqs.AddItemProperty('url', 'string')
    ]));
    const items = await Item.find({});
    var requests = [];
    // Add item to DB
    items.forEach(item => {
        client.send(new rqs.AddItem(item._id));
        var itemId = item._id;
        var obj = {
            'labels': item.labels,
            'count': item.count,
            'title': item.title,
            'url': item.url
        };
        client.send(new rqs.RecommendItemsToItem(itemId, 5, { 'scenario': 'ItemRecommendation'}));
        requests.push(new rqs.SetItemValues(itemId, obj, { cascadeCreate: true }));
    });
    return client.send(new rqs.Batch(requests));
}

addItemToDB();

//  Get recommendations fromm Recombee DB
async function getRecom() {
    const items = await Item.find({});
    items.forEach(item => {
        var itemId = item._id;
        client.send(new rqs.RecommendItemsToItem(itemId, null, 5, { scenarios: 'ItemRecommendation', returnProperties: true }), (err, recommendations) => {
            console.log(recommendations.recomms); // This will output titles and urls of recommednded item
        });
    });
}

getRecom();