const mongoose = require("mongoose");
const puppeteer = require("puppeteer");
const chalk = require("chalk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Models for featured items
const Item = require("./models/Item");

// chalk config
const error = chalk.bold.red;
const success = chalk.keyword("green");

// Connect to Mongo
mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => console.log(err));


function updatePriceInfo() {
    console.log("starting update");
    Item.find().then(items => {
        if (items) {
        for (var i = 0; i < items.length; i++) {
            updateOneItem(items[i], i);
        }
        }
    });
}

async function scrapeGoogleShopPrice(url) {
    try {
        // open the headless browser
        var browser = await puppeteer.launch({ headless: true });

        // open a new page
        var page = await browser.newPage();

        // enter url in page
        await page.goto(url);
        await page.waitForSelector("span.NVfoXb");

        // change google shopping view
        var price = await page.evaluate(() => {
        return document.querySelector(`span.NVfoXb > b`)
                .innerHTML.trim()
                .replace("$", "")
        });

        await browser.close();
        console.log(success("Browser Closed"));
        return price;
    } catch (err) {
        // Catch and display errors
        console.log(error(err));
        await browser.close();
        console.log(error("Browser Closed"));
    }
}

async function updateOneItem(item, i) {
    var url = item.url;
    // if amazon or steam url
    if (url.includes("amazon") || url.includes("steam")) {
        priceFind.findItemDetails(url, async function(err, itemDetails) {
            if (itemDetails != undefined) {
                console.log(i + " updating " + item.title);
                var new_price = itemDetails.price;

                if (new_price >= 0) {
                var new_price_info = { price: new_price, date: Date().toString() };
                await Item.updateOne(
                    { _id: item.id },
                    { $push: { price_hist: new_price_info }, current_price: new_price }
                );
                }

            }
        });
    } else {
        // if any other url, item will be searched for on google shopping
        if (item.price_url != null) {
            var new_price = await scrapeGoogleShopPrice(item.price_url);

            if (new_price > 0) {
                var new_price_info = { price: new_price, date: Date().toString() };
                await Item.updateOne(
                    { _id: item.id },
                    { $push: { price_hist: new_price_info }, current_price: new_price }
                );
            }

        }
    }
}

async function checkPrices() {
    const results = await Wishlist.find({}).populate("items.item_id");
    var notifyItems = [];

    results.forEach(list => {
        notifyItems = [];
        list.items.forEach(itemObj => {
            if (
                itemObj.notify_price &&
                itemObj.item_id.current_price <= itemObj.notify_price
            ) {
                // Update array of items to be notified about
                var savings =
                itemObj.item_id.price_hist[itemObj.item_id.price_hist.length - 1]
                    .price - itemObj.item_id.current_price;
                itemObj.savings = savings;
                notifyItems.push(itemObj);
            }
        });
        // Send email to user
        priceNotify(notifyItems, list.owner, list.name);
    });
}

async function priceNotify(items, owner, listname) {
    const params = {
        items,
        listname
    };
    await sendEmail({
        template: "pricenotify",
        params,
        email: owner,
        subject: `Your wishlist: ${listname}, has items on sale`,
        from: "Sparklist"
    });
}

var interval = 86400000;
setInterval(() => {
  updatePriceInfo();
  checkPrices();
}, interval);

