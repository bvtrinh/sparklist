// Need this to work with Google Vision API
"use strict";
const path = require("path");
require("dotenv").config(path.join(__dirname, "./.env"));

const vision = require("@google-cloud/vision");
const client = new vision.ImageAnnotatorClient();

module.exports = async function(image_url) {
  try {
    const [result] = await client.labelDetection(image_url);
    const labels = result.labelAnnotations;
    var arr = [];
    labels.forEach(label => {
      arr.push(label.description);
    });
    return arr;
  } catch (err) {
    console.log(err);
  }
};
