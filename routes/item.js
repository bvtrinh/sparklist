const router = require("express").Router();
const labeler = require("../scripts/vision/labeling");
const PriceFinder = require("price-finder");
const priceFind = new PriceFinder();
// Item Model
const Item = require("../models/Item");
const Wishlist = require("../models/Wishlist");
const authCheck = (req, res, next) => {
  if (!req.user) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};
router.get("/add", authCheck, async (req, res) => {
  const lists = await Wishlist.find({ owner: req.user.email });
  res.render("pages/item/addItem", { user: req.user, lists });
});

router.post("/addlist", authCheck, async (req, res) => {
  const item_id = req.body.id;
  const list_id = { _id: req.body.list };
  // Add item to wishlist
  await Wishlist.updateOne(list_id, { $push: { items: item_id } });

  // Should redirect to wishlist, this goes to the manage side
  res.redirect(`/wishlist/manage/?wishlistID=${req.body.list}`);
});

router.post("/process", (req, res) => {
  const url = req.body.item_url;
  const list_id = { _id: req.body.list };

  // Check if item exits in DB

  // Pull title, price, image (tentative), labels
  // Need to pull image before getting labels
  priceFind.findItemDetails(url, async (err, itemDetails) => {
    const newItem = new Item({
      title: itemDetails.name,
      price_hist: { price: itemDetails.price, date: Date().toString() },
      category: itemDetails.category,
      url
    });

    // Add item to wishlist
    await Wishlist.updateOne(list_id, { $push: { items: newItem._id } });

    // Add item to DB
    await newItem.save();
    res.redirect(`/item/${newItem._id}`);
  });
});

router.get("/search", async (req, res) => {
  Item.find().then(items => {
    res.render("pages/item/search", { user: req.user, items });
  });
});

router.get("/:id", async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (req.user) {
    const lists = await Wishlist.find({ owner: req.user.email });
    return res.render("pages/item/viewItem", { user: req.user, item, lists });
  } else {
    return res.render("pages/item/viewItem", { user: req.user, item });
  }
});

module.exports = router;
