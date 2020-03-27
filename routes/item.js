const router = require("express").Router();
const labeler = require("../scripts/vision/labeling");
const PriceFinder = require("price-finder");
const scrape = require("../scripts/spider-pictures");
const priceFind = new PriceFinder();
// Item Model
const Item = require("../models/Item");
const Wishlist = require("../models/Wishlist");

const puppeteer = require("puppeteer");
const chalk = require("chalk");

const error = chalk.bold.red;
const success = chalk.keyword("green");

// Dropdown for sorting type
const sorts = [
  ["count", "Popular"],
  ["current_price", "Price: Low to High"],
  ["-current_price", "Price: High to Low"],
  ["title", "Name: A to Z"],
  ["-title", "Name: Z to A"]
];

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

router.post("/process", (req, res) => {
  const url = req.body.item_url;
  const list_id = { _id: req.body.list };

  // Check if item exits in DB

  // Pull title, price, image (tentative), labels
  // Need to pull image before getting labels
  priceFind.findItemDetails(url, async (err, itemDetails) => {
    const img_url = await scrape.amazon(url);
    const labels = await labeler(img_url[0]);

    const newItem = new Item({
      title: itemDetails.name,
      price_hist: { price: itemDetails.price, date: Date().toString() },
      current_price: itemDetails.price,
      category: itemDetails.category,
      img_url: img_url[0],
      url,
      labels
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
    res.render("pages/item/search", {
      user: req.user,
      items,
      sorts,
      sort_type: null
    });
  });
});

router.post("/search", async (req, res) => {
  const { keyword, min_price, max_price, sort_type } = req.body;

  const filters = {
    title: new RegExp(keyword, "i"),
    current_price: { $lte: max_price, $gte: min_price }
  };
  try {
    const items = await Item.find(filters).sort(sort_type);
    if (items.length <= 0) throw "No search results found";
    return res.render("pages/item/search", {
      user: req.user,
      items,
      keyword,
      min_price,
      max_price,
      sort_type,
      sorts
    });
  } catch (err) {
    return res.render("pages/item/search", {
      keyword,
      min_price,
      max_price,
      sort_type,
      sorts,
      user: req.user,
      items: null,
      err_msg: err
    });
  }
});

router.post("/homeSearch", async (req, res) => {
  const { keyword } = req.body;

  const filters = {
    title: new RegExp(keyword, "i")
  };
  try {
    const items = await Item.find(filters);
    if (items.length <= 0) throw "No search results found";
    return res.render("pages/item/search", {
      user: req.user,
      items,
      keyword,
      sort_type: null,
      sorts
    });
  } catch (err) {
    return res.render("pages/item/search", {
      keyword,
      sort_type: null,
      sorts,
      user: req.user,
      items: null,
      err_msg: err
    });
  }
});

router.get("/find", (req, res) => {
  res.render("pages/item/findItem");
});

router.post("/scrape", async (req, res) => {

  try {
    const itemName = req.body.itemName;

    // open the headless browser
    var browser = await puppeteer.launch({ headless: true });

    // open a new page
    var page = await browser.newPage();

    // enter url in page
    await page.goto(`https://shopping.google.com/`);
    await page.type('input.lst', itemName);
    page.keyboard.press('Enter');
    await page.waitForSelector('a.VZTCjd.REX1ub.translate-content');
  
    // scrape info from page
    var itemLinks = await page.evaluate(() => {

      var links = document.querySelectorAll(`a.VZTCjd.REX1ub.translate-content`);

      let itemLinks = [];
      var j = 0;
      for (var i = 0; i < links.length; i++) {
        if(links[i].getAttribute("href").includes("shopping")){
          itemLinks[j] = "https://www.google.com" + links[i].getAttribute("href");
          j++;
        }
      }

      return itemLinks;
    });

    let items = [];
    for (var i = 0; i < itemLinks.length; i++) {

      await page.goto(itemLinks[i]);
      await page.waitForSelector('span.BvQan.sh-t__title-pdp.sh-t__title.translate-content');

      items[i] = await page.evaluate((i) => {
        item = {
          title: document.querySelector(`span.BvQan.sh-t__title-pdp.sh-t__title.translate-content`).innerHTML.trim(),
          current_price: document.querySelector(`span.NVfoXb > b`).innerHTML.trim().replace('$',''),
          url: "google.com" + document.querySelector(`a.txYPsb.mpeCOc.shntl`).getAttribute("href"),
          img_url:  document.querySelector(`img.sh-div__image.sh-div__current`).getAttribute("src")
        }

        return item;
      });
    }
    
    for (var i = 0; i < items.length; i++) {
      // get actual link to item
      await page.goto("https://www." + items[i].url);
      items[i].url = await page.url();
    }

    await browser.close();
    console.log(success("Browser Closed"));

    if (req.user) {
      const lists = await Wishlist.find({ owner: req.user.email });
      return res.render("pages/item/searchResults", { user: req.user, items, lists });
    } else {
      return res.render("pages/item/searchResults", { user: req.user, items });
    }

  } catch (err) {
    // Catch and display errors
    console.log(error(err));
    await browser.close();
    console.log(error("Browser Closed"));
  }
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
