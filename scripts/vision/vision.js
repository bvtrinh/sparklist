'use strict';

require('dotenv').config()

var labeler = require('./function2.js');
var express = require('express');
var app = express();
var http = require('http');
const mongoose = require("mongoose");
var fs = require('fs');
var path = require('path');
var url = require('url');
var qs = require('querystring');
const socketIO = require('socket.io');
const PORT = process.env.PORT || 5000;
const db = process.env.MONGOURI;

const item_schema = mongoose.Schema({
	title: String,
	url: String,
	img_url: String,
	labels: Array,
	price_hist: [{ price: Number, date: Date }],
	count: Number,
	category: String
});

var Item = mongoose.model('item', item_schema);

// Imports the Google Cloud client library
const vision = require('@google-cloud/vision');
 
// Creates a client
const client = new vision.ImageAnnotatorClient();

var items = fs.readFileSync(path.join(__dirname, "./items.json"));
items = JSON.parse(items);
// console.log(items);

// mongoose //
// mongoose
//   .connect(db, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//     useCreateIndex: true
//   })
//   .then(() => console.log("MongoDB Connected..."))
//   .catch(err => console.log(err)
// );

// let item_data = require('./items.json');
// let item_link = item_data.item_link;

items.forEach(async (item) => {
	let u = item.img_url;
	// console.log(u);
	let x = await labeler(u);

	// const results = await Promise.all([labeler(u)]);
	// console.log(results);

	console.log(x);
});