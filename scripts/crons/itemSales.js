const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Models for featured items
const Wishlist = require("../../models/Wishlist");
const Item = require("../../models/Item");
const sendEmail = require("../email");

// Connect to Mongo
mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => console.log(err));

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

try {
  checkPrices();
} catch (err) {
  console.log(err);
}
