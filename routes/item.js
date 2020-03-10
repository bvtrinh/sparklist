const router = require("express").Router();

// Item Model
const Item = require("../models/Item");

router.get("/", (req, res) => {
  Item.find()
    .sort({ date: -1 })
    .then(items => res.json(items));
});

// @route POST api/items
// @desc Create an item
// @access Private
router.post("/", (req, res) => {
  const new_item = new Item({
    name: req.body.name
  });

  new_item.save().then(item => res.json(item));
});

router.get("/search", (req, res) => {
  res.render("pages/search");
});

module.exports = router;
