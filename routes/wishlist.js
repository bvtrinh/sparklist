const router = require("express").Router();
const tokenfield = require("bootstrap-tokenfield-jquery3");
const sendEmail = require("../scripts/email/");
const path = require("path");
require("dotenv").config(path.join(__dirname, "../.env"));

// Models
const User = require("../models/User");
const Wishlist = require("../models/Wishlist");
const Group = require("../models/Group");
const Item = require("../models/Item");

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

const ownerCheck = async (req, res, next) => {
  const results = await Wishlist.findOne({
    $and: [
      { owner: req.session.passport.user.email },
      {
        _id:
          req.query.wishlistID || req.params.wishlistID || req.body.wishlistID
      }
    ]
  });

  if (results) {
    next();
  } else {
    // Current user is not the owner of the wishlist redirect to error page
    res.redirect("/error");
  }
};

// A user should be able to view a wishlist if they are on the sharedlist of
// the wishlist, the owner, or part of the group the wishlist is attached to
const accessCheck = async (req, res, next) => {
  const shared = await Wishlist.findOne({
    $and: [
      { _id: req.query.wishlistID || req.params.wishlistID },
      { sharedUsers: req.session.passport.user.email }
    ]
  });

  const owner = await Wishlist.findOne({
    $and: [
      { owner: req.session.passport.user.email },
      { _id: req.query.wishlistID || req.params.wishlistID }
    ]
  });

  const group = await Wishlist.findOne(
    {
      _id: req.query.wishlistID || req.params.wishlistID
    },
    { groups: 1 }
  ).populate({
    path: "groups",
    match: {
      $or: [
        { members: req.session.passport.user.email },
        { admin: req.session.passport.user.email }
      ]
    }
  });

  if (shared || owner || group) {
    next();
  } else {
    res.redirect("/error");
  }
};

const sendNotification = async (newInvites, fullname, listID, listname) => {
  // Send email notification to groups
  let list_link;
  list_link = `${process.env.DOMAIN_LINK}/wishlist/view/?wishlistID=${listID}`;

  const params = {
    fullname,
    listname: listname,
    list_link
  };

  await sendEmail({
    template: "email",
    params: params,
    email: newInvites.join(),
    subject: `${fullname} invited you to see their wishlist`,
    from: fullname
  });
};

async function addItemToList(req, item_id, list_id) {
  const itemExists = await Wishlist.find({
    _id: list_id,
    "items.item_id": item_id
  });

  if (itemExists.length > 0) {
    var errors = [];
    errors.push({ msg: "You've added this item to this wishlist already" });
    req.session.errors = errors;
  } else {
    // Add item to wishlist
    await Wishlist.updateOne(
      { _id: list_id },
      {
        $push: { items: { item_id } }
      }
    );
  }
}

async function checkDuplicates(title, url) {
  var err_msg;
  var status = 0;

  // Check if item exists in DB: any matching title or url
  const result = await Item.findOne({
    $or: [{ title: title }, { url: url }]
  });

  if (result) {
    return {
      status: -1,
      err_msg: "This item has already been added by another user",
      item: result
    };
  }

  return { status: 0 };
}

router.get("/create", authCheck, (req, res) => {
  res.render("pages/wishlist/createWishlist", {
    user: req.session.passport.user
  });
});

// handle wishlist creation
router.post("/create", authCheck, (req, res) => {
  const { wishlistName, visibility } = req.body;
  let errors = [];

  if (!wishlistName) {
    errors.push({ msg: "Please enter wishlist name" });
  }

  if (!visibility) {
    errors.push({ msg: "Please select a visibility level" });
  }

  if (errors.length > 0) {
    res.render("pages/wishlist/createWishlist", {
      user: req.session.passport.user,
      errors,
      wishlistName,
      invites: null,
      visibility
    });
  } else {
    // initial validation passed
    // check if user has wishlist with same name

    Wishlist.find({
      owner: req.session.passport.user.email,
      name: wishlistName
    }).then(wishlist => {
      if (wishlist.length != 0) {
        // user already has wishlist with entered name -> error
        errors.push({
          msg:
            "You already created a wishlist with this name. Please try again with a different name."
        });
        res.render("pages/wishlist/createWishlist", {
          errors,
          visibility
        });
      } else {
        new Wishlist({
          name: wishlistName,
          owner: req.session.passport.user.email,
          visibility: visibility
        })
          .save()
          .then(newWishlist => {
            res.redirect("/wishlist");
          });
      }
    });
  }
});

router.post("/update/", authCheck, ownerCheck, (req, res) => {
  const { wishlistName, sharedUsers, visibility } = req.body;
  let wishlistID = req.query.wishlistID;

  var usersList = [];
  if (sharedUsers !== "") {
    usersList = sharedUsers.trim().split(",");

    // When submitting the form without any changes the string will split on the comma
    // and add another element to the memberList array
    if (usersList[usersList.length - 1] === "") {
      usersList.pop();
    }
  }

  Wishlist.findById(wishlistID).then(async wishlist => {
    if (wishlist) {
      if (wishlistName != wishlist.name) {
        wishlist.name = wishlistName;
      }
      var oldSharedUsers = wishlist.sharedUsers;
      wishlist.sharedUsers = [];

      usersList.forEach(function(user, index) {
        wishlist.sharedUsers.push(user.trim());
      });

      const fullname = `${req.session.passport.user.fname} ${req.session.passport.user.lname}`;
      var newInvites = usersList.filter(member => {
        return !oldSharedUsers.includes(member);
      });

      if (newInvites.length > 0) {
        // sendNotification(newInvites, fullname, wishlistID, wishlist.name);
      }

      if (visibility != undefined && visibility != wishlist.visibility) {
        wishlist.visibility = visibility;
      }
      wishlist.save();
    }
  });

  res.redirect("/wishlist/manage/?wishlistID=" + wishlistID);
});

router.post("/delete/", authCheck, ownerCheck, async (req, res) => {
  let wishlistID = req.query.wishlistID;
  try {
    // Get the group IDs that are related to this group
    const { groups } = await Wishlist.findById(wishlistID, { groups: 1 });

    // Remove the wishlist id from the groups
    await Group.updateMany(
      { _id: { $in: groups } },
      { $pull: { wishlists: wishlistID } }
    );

    await Wishlist.findOneAndDelete({ _id: wishlistID });
    res.redirect("/wishlist");
  } catch (err) {
    console.log(err);
  }
});

// AJAX called used to fill the modal on the view /group/viewGroup
router.post("/getlists", async (req, res) => {
  const groupID = req.body.groupID;
  const results = await Wishlist.find({
    owner: req.session.passport.user.email
  });
  const idObj = await Wishlist.find(
    { owner: req.session.passport.user.email },
    { _id: 1 }
  );
  var ids = [];
  idObj.forEach(ele => {
    ids.push(ele._id);
  });
  const grps = await Group.findById(groupID, { wishlists: 1 });

  // Get the current list
  var currentList = ids
    .filter(id => {
      return grps.wishlists.includes(id);
    })
    .join();

  return res.json({ results, currentList });
});

router.get("/", authCheck, (req, res) => {
  // find all wishlists associated with this user
  Wishlist.find({
    $or: [
      { owner: req.session.passport.user.email },
      { sharedUsers: req.session.passport.user.email }
    ]
  }).then(wishlists => {
    if (wishlists.length == 0) {
      // user does not belong to any wishlists
      // add some type of message
      res.render("pages/wishlist/listWishlist", {
        user: req.session.passport.user,
        msg: "You do not have any wishlists.",
        myLists: [],
        sharedLists: []
      });
    } else {
      const sharedLists = wishlists.filter(
        list => list.owner !== req.session.passport.user.email
      );
      const myLists = wishlists.filter(
        list => list.owner === req.session.passport.user.email
      );
      res.render("pages/wishlist/listWishlist", {
        user: req.session.passport.user,
        msg: "",
        sharedLists,
        myLists
      });
    }
  });
});

router.get("/manage/", authCheck, ownerCheck, (req, res) => {
  let wishlistID = req.query.wishlistID;
  Wishlist.findById(wishlistID).then(wishlist => {
    if (wishlist) {
      res.render("pages/wishlist/updateWishlist", {
        wishlist,
        user: req.session.passport.user
      });
    }
  });
});

router.get("/view/", authCheck, accessCheck, async (req, res) => {
  const wishlistID = req.query.wishlistID;

  if (req.session.errors) {
    var errors = req.session.errors;
    delete req.session.errors;
  }

  const wishlist = await Wishlist.findById(wishlistID).populate(
    "items.item_id"
  );
  return res.render("pages/wishlist/viewWishlist", {
    errors,
    wishlist,
    wishlistItems: wishlist.items,
    user: req.session.passport.user
  });
});

router.post("/addlist", authCheck, async (req, res) => {
  await addItemToList(req, req.body.id, req.body.list);

  // Redirect to wishlist view
  return res.redirect(`/wishlist/view/?wishlistID=${req.body.list}`);
});

router.post("/addListScraped", authCheck, async (req, res) => {
  const {
    title,
    current_price,
    url,
    img_url,
    labels,
    list_id,
    category
  } = req.body;

  // Check if the item has been added to the DB
  const isDuplicate = await checkDuplicates(title, url);

  // No duplicate exists in the DB
  if (isDuplicate.status === 0) {
    // Add item to DB
    var labelsList = labels.split(",");
    const newItem = new Item({
      title: title,
      price_hist: { price: current_price, date: Date().toString() },
      current_price: current_price,
      img_url: img_url,
      url: url,
      labels: labelsList,
      category: category
    });
    const savedItem = await newItem.save();
    await addItemToList(req, savedItem._id, list_id);
  }
  // Duplicate exists in the DB
  else {
    // Add that item instead
    const savedItem = isDuplicate.item;

    // Now make sure that the item isn't already in the wishlist
    await addItemToList(req, savedItem._id, list_id);
  }

  // Redirect to wishlist view
  return res.redirect(`/wishlist/view/?wishlistID=${list_id}`);
});

router.post(
  "/deleteItem/:wishlistID/:itemID",
  authCheck,
  ownerCheck,
  async (req, res) => {
    let wishlistID = req.params.wishlistID;
    let itemID = req.params.itemID;

    await Wishlist.updateOne(
      { _id: wishlistID },
      { $pull: { items: { item_id: itemID } } }
    );

    // Redirect to wishlist view
    res.redirect(`/wishlist/view/?wishlistID=${wishlistID}`);
  }
);

router.post("/set-notify-price", ownerCheck, async (req, res) => {
  const { wishlistID, itemID, notifyPrice } = req.body;
  try {
    await Wishlist.updateOne(
      { _id: wishlistID, "items.item_id": itemID },
      { $set: { "items.$.notify_price": notifyPrice } }
    );
  } catch (err) {
    console.log(err);
  } finally {
    // Redirect to wishlist view
    return res.redirect(`/wishlist/view/?wishlistID=${wishlistID}`);
  }
});
module.exports = router;
