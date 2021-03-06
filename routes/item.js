const router = require("express").Router();
const gis = require("g-i-s");
const puppeteer = require("puppeteer");
const chalk = require("chalk");
const labeler = require("../scripts/vision/labeling");
const scrape = require("../scripts/spider-pictures");
const app = require("../scripts/spider-pictures/index.js");
const PriceFinder = require("price-finder");
const priceFind = new PriceFinder();
const path = require("path");

// Item Model
const Item = require("../models/Item");
const Wishlist = require("../models/Wishlist");

// chalk config
const error = chalk.bold.red;
const success = chalk.keyword("green");

// Dropdown for sorting type
const sorts = [
  ["-count", "Popular"],
  ["current_price", "Price: Low to High"],
  ["-current_price", "Price: High to Low"],
  ["title", "Name: A to Z"],
  ["-title", "Name: Z to A"],
];

// Item categories
const categories = {
  Books: ["Text", "Font", "Poster", "Magazine", "Book cover"],
  Clothing: ["Clothing"],
  Electronics: ["Technology", "Electronic device", "Gadget"],
  "Home and Kitchen": [
    "Home appliance",
    "Kitchen appliance",
    "Small appliance",
  ],
  Movie: ["Movie", "Poster", "Hero"],
  "Sports Equipment": ["Sports equipment", "Sports gear", "Helmet"],
  Tools: ["Tools"],
  "Video Games": ["Video game software", "Games", "Pc game"],
};

const categoryKeys = [
  "All",
  "Books",
  "Clothing",
  "Electronics",
  "Home and Kitchen",
  "Movie",
  "Other",
  "Sports Equipment",
  "Tools",
  "Video Games",
];

const authCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

const getUserInfo = (req) => {
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
    "Video Games": 0,
  };

  // The case where we are using the Amazon Price Finder package
  // Sometimes will return a accurate category
  if (category !== "Other") return category;

  // Test all categories
  for (let [key, value] of Object.entries(categories)) {
    let matchedTerms = labels.filter((term) => {
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

async function getMaxPrice() {
  const item = await Item.find().sort("-current_price").limit(1);
  return item[0].current_price;
}

router.get("/max-price", async (req, res) => {
  return res.json({ max_price: await getMaxPrice() });
});

router.get("/add", authCheck, (req, res) => {
  if (req.session.errors) {
    var errors = req.session.errors;
    delete req.session.errors;
  }

  res.render("pages/item/findItem", { user: req.session.passport.user });
});

router.get("/search/:page", async (req, res) => {
  var perPage = 12;
  var page = req.params.page == 0 ? 1 : req.params.page;
  const user = getUserInfo(req);
  var searchParams;
  var isSearch = false;

  if (req.params.page == 0) {
    delete req.session.search;
  }

  if (req.session.search) {
    isSearch = true;
    searchParams = req.session.search;
    searchParams.filters.title = new RegExp(searchParams.keyword, "i");
  }

  var foundItems = await Item.find(isSearch ? searchParams.filters : {});
  Item.find(isSearch ? searchParams.filters : {})
    .skip(perPage * page - perPage)
    .limit(perPage)
    .sort(isSearch ? searchParams.sort_type : "-count")
    .exec(async function (err, items) {
      Item.countDocuments().exec(async function (err, count) {
        if (err) return next(err);
        res.render("pages/item/search", {
          user,
          items,
          sorts,
          categoryKeys,
          curr_category: isSearch ? searchParams.curr_category : null,
          min_price: isSearch ? searchParams.min_price : 0,
          max_price: isSearch ? searchParams.max_price : await getMaxPrice(),
          keyword: isSearch ? searchParams.keyword : "",
          sort_type: isSearch ? searchParams.sort_type : null,
          current: page,
          pages: Math.ceil(foundItems.length / perPage),
        });
      });
    });
});

router.post("/search/:page", async (req, res) => {
  const { keyword, min_price, max_price, sort_type, curr_category } = req.body;
  var perPage = 12;
  var page = req.params.page || 1;

  // Delete the previous search filters
  if (req.session.search) {
    delete req.session.search;
  }
  const user = getUserInfo(req);
  // Need to add another filter for category
  let filters = {
    title: new RegExp(keyword, "i"),
    current_price: { $lte: max_price, $gte: min_price },
  };
  if (curr_category !== "All") {
    filters.category = curr_category;
  }

  // Set the new search filters
  req.session.search = {
    keyword,
    min_price,
    max_price,
    sort_type,
    curr_category,
    filters,
  };

  try {
    var foundItems = await Item.find(filters);
    Item.find(filters)
      .skip(perPage * page - perPage)
      .limit(perPage)
      .sort(sort_type)
      .exec(function (err, items) {
        Item.countDocuments().exec(function (err, count) {
          if (err) return next(err);
          res.render("pages/item/search", {
            user,
            items,
            keyword,
            min_price,
            max_price,
            sort_type,
            sorts,
            categoryKeys,
            curr_category,
            current: page,
            pages: Math.ceil(foundItems.length / perPage),
            err_msg: items.length <= 0 ? "No search results found" : null,
          });
        });
      });
  } catch (err) {
    return res.render("pages/item/search", {
      keyword,
      min_price,
      max_price,
      sort_type,
      sorts,
      categoryKeys,
      curr_category,
      user,
      items: null,
      err_msg: err,
    });
  }
});

router.post("/homeSearch", async (req, res) => {
  const { keyword } = req.body;
  var perPage = 12;
  var page = req.params.page || 1;

  const user = getUserInfo(req);
  const filters = {
    title: new RegExp(keyword, "i"),
  };

  if (req.session.search) {
    isSearch = true;
    searchParams = req.session.search;
    searchParams.filters.title = new RegExp(searchParams.keyword, "i");
  }

  try {
    const items = await Item.find(filters);
    if (items.length <= 0) throw "No search results found";
    return res.render("pages/item/search", {
      user,
      items,
      keyword,
      categoryKeys,
      curr_category: isSearch ? searchParams.curr_category : null,
      sort_type: null,
      sorts,
      current: page,
      pages: Math.ceil(items.length / perPage),
    });
  } catch (err) {
    return res.render("pages/item/search", {
      keyword,
      sort_type: null,
      sorts,
      categoryKeys,
      curr_category: isSearch ? searchParams.curr_category : null,
      user,
      items: null,
      err_msg: err,
    });
  }
});

async function labelItem(itemName) {
  return new Promise((resolve) => {
    // get image of item
    gis(itemName, (error, results) => {
      if (error) {
        console.log(error);
      } else {
        // get labels from image
        var labels = labeler(results[0].url);
        resolve(labels);
      }
    });
  });
}

async function scrapeAmazon(url) {
  return new Promise((resolve) => {
    priceFind.findItemDetails(url, async (err, itemDetails) => {
      const img_url = await scrape.amazon(url);
      const labels = await labeler(img_url[0]);

      var item = new Item({
        title: itemDetails.name,
        price_hist: { price: itemDetails.price, date: Date().toString() },
        current_price: itemDetails.price,
        category: await getCategory(labels, itemDetails.category),
        img_url: img_url[0],
        price_url: null,
        url,
        labels,
      });
      resolve(item);
    });
  });
}

async function scrapeGoogleShop(itemName) {
  try {
    // open the headless browser
    var browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // open a new page
    var page = await browser.newPage();

    // enter url in page
    await page.goto(`https://google.com/shopping?nord=1`);

    // Testing on prod servers
    // console.log(await page.url());

    await page.waitForSelector("input.lst");
    await page.type("input.lst", itemName);
    page.keyboard.press("Enter");
    await page.waitForSelector("span.qa708e");

    // change google shopping view
    var viewLink = await page.evaluate(() => {
      // switch view
      if (document.querySelectorAll(`a.qPKfxd > span.qa708e`).length > 0) {
        console.log(document.querySelector(`a.qPKfxd`).getAttribute("href"));

        return (
          "https://www.google.com" +
          document.querySelector(`a.qPKfxd`).getAttribute("href")
        );
      } else {
        return null;
      }
    });

    if (viewLink != null) {
      await page.goto(viewLink);
    }

    await page.waitForSelector("a.VZTCjd.REX1ub.translate-content");

    // scrape info from page
    var itemLinks = await page.evaluate(() => {
      var links = document.querySelectorAll(
        `a.VZTCjd.REX1ub.translate-content`
      );

      let itemLinks = [];
      var j = 0;
      for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href").includes("shopping")) {
          itemLinks[j] =
            "https://www.google.com" + links[i].getAttribute("href");
          j++;
        }
      }

      return itemLinks;
    });

    // limit number of items scraped to 5
    var maxItems = itemLinks.length > 3 ? 3 : itemLinks.length;

    let items = [];
    for (var i = 0; i < maxItems; i++) {
      await page.goto(itemLinks[i]);
      await page.waitForSelector(
        "span.BvQan.sh-t__title-pdp.sh-t__title.translate-content"
      );

      // Testing on prod servers
      // await page.screenshot({
      //   path: path.join(__dirname, `../public/img/${i}.png`),
      // });

      items[i] = await page.evaluate((i) => {
        var priceSelector = document.querySelector("span.NVfoXb > b");
        if (!document.querySelector("span.WBDTRb")) {
          item = {
            title: document
              .querySelector(
                `span.BvQan.sh-t__title-pdp.sh-t__title.translate-content`
              )
              .innerHTML.trim(),
            price_hist: {
              price: priceSelector,
              date: Date().toString(),
            },
            current_price: priceSelector.innerHTML.trim().replace("$", ""),
            url:
              "google.com" +
              document
                .querySelector(`a.txYPsb.mpeCOc.shntl`)
                .getAttribute("href"),
            price_url: null,
            img_url: document
              .querySelector(`img.sh-div__image.sh-div__current`)
              .getAttribute("src"),
            labels: null,
          };
          return item;
        }
      });
    }

    var validItems = [];
    items.forEach(async (item, i) => {
      if (item !== undefined) {
        validItems.push(item);
      }
    });

    for (var i = 0; i < validItems.length; i++) {
      // get actual link to item and labels
      await page.goto("https://www." + validItems[i].url);
      validItems[i].url = await page.url();

      // add price_url
      validItems[i].price_url = itemLinks[i];

      // label item
      validItems[i].labels = await labelItem(validItems[i].title);

      // Categorize item
      validItems[i].category = await getCategory(validItems[i].labels);
    }

    await browser.close();
    console.log(success("Browser Closed"));

    return validItems;
  } catch (err) {
    // Catch and display errors
    console.log(error(err));
    await browser.close();
    console.log(error("Browser Closed"));
  }
}

router.post("/find", async (req, res) => {
  const searchQuery = req.body.searchQuery;

  // check if the search query is a url
  // simple check for now
  // check if url is for amazon item
  if (searchQuery.includes("amazon.c")) {
    // use price finder to get item info
    var items = [];
    var item = await scrapeAmazon(searchQuery);
    var googleItems = await scrapeGoogleShop(item.title);
    if (googleItems !== undefined) {
      items = googleItems;
    }
    items.push(item);
  } else if (
    searchQuery.includes("http") ||
    searchQuery.includes("www") ||
    searchQuery.includes(".com")
  ) {
    // url -> need to scrap title
    var title = await app.getTitle(searchQuery);
    var items = await scrapeGoogleShop(title);
  } else {
    // string -> scrape google shopping
    var items = await scrapeGoogleShop(searchQuery);
  }

  let err = "";
  if (items === undefined || items.length == 0) {
    err = "No items found. Please try again.";
  }

  if (req.session.passport.user) {
    const lists = await Wishlist.find({
      owner: req.session.passport.user.email,
    });
    return res.render("pages/item/searchResults", {
      user: req.session.passport.user,
      items,
      lists,
      err_msg: err,
    });
  } else {
    return res.render("pages/item/searchResults", {
      user: req.session.passport.user,
      items,
      err_msg: err,
    });
  }
});

router.get("/:id", async (req, res) => {
  const item = await Item.findById(req.params.id).populate("recommendations");
  const recomms = item.recommendations;
  if (req.isAuthenticated()) {
    const lists = await Wishlist.find({
      owner: req.session.passport.user.email,
    });
    return res.render("pages/item/viewItem", {
      user: req.session.passport.user,
      recomms,
      item,
      lists,
    });
  } else {
    return res.render("pages/item/viewItem", {
      user: undefined,
      recomms,
      item,
    });
  }
});

router.post("/priceHistory", async (req, res) => {
  const groupID = req.body.groupID;
  const itemID = req.body.itemID;

  const results = await Item.findById(itemID);

  res.json({ results });
});

module.exports = router;
