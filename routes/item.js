const router = require("express").Router();
// Item Model
const Item = require("../models/Item");

router.get("/add", async (req, res) => {
  res.render("pages/item/addItem", { user: req.user });
});

router.get("/process", async (req, res) => {
  // Check if item exits in DB
  // Pull title, price, image (tentative), labels
});

router.get("/search", async (req, res) => {
  Item.find().then(items => {
    res.render("pages/item/search", { user: req.user, items });
  });
});

router.get("/:id", async (req, res) => {
  Item.findById(req.params.id).then(item => {
    return res.render("pages/item/viewItem", { user: req.user, item });
  });
});

module.exports = router;
