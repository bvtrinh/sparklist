const router = require("express").Router();
// Item Model
const Item = require("../models/Item");

router.get("/search", async (req, res) => {
  // var items = await fs.readFile(path.join(__dirname, "../items.json"));
  // items = JSON.parse(items);
  Item.find().then(items => {
    res.render("pages/item/search", { user: req.user, items });
  });
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;
  // var items = await fs.readFile(path.join(__dirname, "../items.json"));
  // const item = JSON.parse(items)[id];

  Item.findById(req.params.id).then(item => {
    return res.render("pages/item/viewItem", { user: req.user, item });
  });
});

module.exports = router;
