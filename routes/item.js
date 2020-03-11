const router = require("express").Router();
const fs = require("fs").promises;
const path = require("path");
// Item Model
const Item = require("../models/Item");

router.get("/search", async (req, res) => {
  var items = await fs.readFile(path.join(__dirname, "../items.json"));
  items = JSON.parse(items);
  res.render("pages/search", { user: req.user, items });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  var items = await fs.readFile(path.join(__dirname, "../items.json"));
  const item = JSON.parse(items)[id];

  res.render("pages/item", { user: req.user, item });
});

module.exports = router;
