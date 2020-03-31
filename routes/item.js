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

// Item categories
const categories = {
  Books: ["Text", "Font", "Poster", "Magazine", "Book cover"],
  Clothing: ["Clothing"],
  Electronics: ["Technology", "Electronic device", "Gadget"],
  "Home and Kitchen": [
    "Home appliance",
    "Kitchen appliance",
    "Small appliance"
  ],
  Movie: ["Movie", "Poster", "Hero"],
  "Sports Equipment": ["Sports equipment", "Sports gear", "Helmet"],
  Tools: ["Tools"],
  "Video Games": ["Video game software", "Games", "Pc game"]
};

const authCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

const getUserInfo = req => {
  return req.isAuthenticated() ? req.session.passport.user : undefined;
};

async function getCategory(labels, category = "Other") {
  let ratings = {
    Books: 0,
    Clothing: 0,
    Electronics: 0,
    "Home and Kitchen": 0,
    Movie: 0,
    "Sports Equipment": 0,
    Tools: 0,
    "Video Games": 0
  };

  // The case where we are using the Amazon Price Finder package
  // Sometimes will return a accurate category
  if (category !== "Other") return category;

  // Test all categories
  for (let [key, value] of Object.entries(categories)) {
    let matchedTerms = labels.filter(term => {
      return value.includes(term);
    });

    ratings[key] = matchedTerms.length;
  }

  // Find the category with the max value
  let maxTerm;
  let maxVal = 0;
  for (let [key, value] of Object.entries(ratings)) {
    if (value > maxVal) {
      maxVal = value;
      maxTerm = key;
    }
  }

  // If no terms match then categorize as Other
  if (maxVal === 0) return "Other";

  return maxTerm;
}

router.get("/add", authCheck, async (req, res) => {
  const lists = await Wishlist.find({ owner: req.session.passport.user.email });
  res.render("pages/item/addItem", { user: req.session.passport.user, lists });
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
      category: await getCategory(labels, itemDetails.getCategory),
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
  const user = getUserInfo(req);
  Item.find().then(items => {
    res.render("pages/item/search", {
      user,
      items,
      sorts,
      sort_type: null
    });
  });
});

router.post("/search", async (req, res) => {
  const { keyword, min_price, max_price, sort_type } = req.body;

  const user = getUserInfo(req);
  const filters = {
    title: new RegExp(keyword, "i"),
    current_price: { $lte: max_price, $gte: min_price }
  };
  try {
    const items = await Item.find(filters).sort(sort_type);
    if (items.length <= 0) throw "No search results found";
    return res.render("pages/item/search", {
      user,
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
      user,
      items: null,
      err_msg: err
    });
  }
});

router.post("/homeSearch", async (req, res) => {
  const { keyword } = req.body;

  const user = getUserInfo(req);
  const filters = {
    title: new RegExp(keyword, "i")
  };
  try {
    const items = await Item.find(filters);
    if (items.length <= 0) throw "No search results found";
    return res.render("pages/item/search", {
      user,
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
      user,
      items: null,
      err_msg: err
    });
  }
});

router.get("/find", authCheck, (req, res) => {
  res.render("pages/item/findItem", { user: req.session.passport.user });
});

router.post("/scrape", authCheck, async (req, res) => {
  try {
    const itemName = req.body.itemName;
    console.log(itemName);

    // open the headless browser
    var browser = await puppeteer.launch({ headless: true });

    // open a new page
    var page = await browser.newPage();

    // enter url in page
    await page.goto(`https://shopping.google.com/`);
    await page.type("input.lst", itemName);
    page.keyboard.press("Enter");
    await page.waitForSelector("a.VZTCjd.REX1ub.translate-content");
    const links = await page.$$("a.VZTCjd.REX1ub.translate-content");
    await links[0].click();

    // wait for page to be loaded
    await page.waitForNavigation({
      waitUntil: "domcontentloaded"
    });

    await page.waitForSelector(
      "span.BvQan.sh-t__title-pdp.sh-t__title.translate-content"
    );

    // scrape info from page
    var item = await page.evaluate(() => {
      item = {
        _id: 0,
        title: document
          .querySelector(
            `span.BvQan.sh-t__title-pdp.sh-t__title.translate-content`
          )
          .innerHTML.trim(),
        current_price: document
          .querySelector(`span.NVfoXb > b`)
          .innerHTML.trim(),
        url:
          "google.com" +
          document.querySelector(`a.txYPsb.mpeCOc.shntl`).getAttribute("href"),
        img_url: document
          .querySelector(`img.sh-div__image.sh-div__current`)
          .getAttribute("src")
      };

      return item;
    });

    // get actual link to item
    await page.goto("https://www." + item.url);
    var itemurl = await page.url();
    item.url = itemurl;

    item.current_price = item.current_price.replace("$", "");

    console.log(item);

    await browser.close();
    console.log(success("Browser Closed"));

    if (req.session.passport.user) {
      const lists = await Wishlist.find({
        owner: req.session.passport.user.email
      });
      return res.render("pages/item/viewItem", {
        user: req.session.passport.user,
        item,
        lists
      });
    } else {
      return res.render("pages/item/viewItem", {
        user: req.session.passport.user,
        item
      });
    }
  } catch (err) {
    // Catch and display errors
    console.log(error(err));
    await browser.close();
    console.log(error("Browser Closed"));
  }

  console.log("done");
});

router.get("/:id", async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (req.isAuthenticated()) {
    const lists = await Wishlist.find({
      owner: req.session.passport.user.email
    });
    return res.render("pages/item/viewItem", {
      user: req.session.passport.user,
      item,
      lists
    });
  } else {
    return res.render("pages/item/viewItem", {
      user: undefined,
      item
    });
  }
});

module.exports = router;
