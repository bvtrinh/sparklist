// Example script of usage
const labeler = require("./labeling");
const fs = require("fs");
const path = require("path");
var items = fs.readFileSync(path.join(__dirname, "../../items.json"));
items = JSON.parse(items);

items.forEach(async item => {
  let u = item.img_url;
  let x = await labeler(u);
  console.log(x);
});
