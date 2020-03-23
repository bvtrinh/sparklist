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
  if (!req.user) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

const ownerCheck = async (req, res, next) => {
  const results = await Wishlist.findOne({
    $and: [
      { owner: req.user.email },
      { _id: req.query.wishlistID || req.params.wishlistID }
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
const accessCheck = async (req, res, next) => {};

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

router.get("/create", authCheck, (req, res) => {
  res.render("pages/wishlist/createWishlist", { user: req.user });
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
      user: req.user,
      errors,
      wishlistName,
      invites: null,
      visibility
    });
  } else {
    // initial validation passed
    // check if user has wishlist with same name

    Wishlist.find({ owner: req.user.email, name: wishlistName }).then(
      wishlist => {
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
            owner: req.user.email,
            visibility: visibility
          })
            .save()
            .then(newWishlist => {
              res.redirect("/wishlist");
            });
        }
      }
    );
  }
});

router.post("/update/", authCheck, ownerCheck, (req, res) => {
  const { wishlistName, sharedUsers, visibility } = req.body;
  let wishlistID = req.query.wishlistID;

  var usersList = [];
  if (sharedUsers !== "") {
    usersList = sharedUsers.trim().split(",");
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

      const fullname = `${req.user.fname} ${req.user.lname}`;
      var newInvites = usersList.filter(member => {
        return !oldSharedUsers.includes(member);
      });

      if (newInvites.length > 0) {
        sendNotification(newInvites, fullname, wishlistID, wishlist.name);
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
  const results = await Wishlist.find({ owner: req.user.email });
  const idObj = await Wishlist.find({ owner: req.user.email }, { _id: 1 });
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
    $or: [{ owner: req.user.email }, { sharedUsers: req.user.email }]
  }).then(wishlists => {
    if (wishlists.length == 0) {
      // user does not belong to any wishlists
      // add some type of message
      res.render("pages/wishlist/listWishlist", {
        user: req.user,
        msg: "You do not have any wishlists.",
        wishlists: wishlists
      });
    } else {
      res.render("pages/wishlist/listWishlist", {
        user: req.user,
        msg: "",
        wishlists: wishlists
      });
    }
  });
});

router.get("/manage/", authCheck, ownerCheck, (req, res) => {
  let wishlistID = req.query.wishlistID;
  Wishlist.findById(wishlistID).then(wishlist => {
    if (wishlist) {
      res.render("pages/wishlist/updateWishlist", { wishlist, user: req.user });
    }
  });
});

router.get("/view/", authCheck, accessCheck, (req, res) => {
  const wishlistID = req.query.wishlistID;

  Wishlist.findById(wishlistID).then(wishlist => {
    if (wishlist) {
      Promise.all(
        wishlist.items.map(item => {
          return Item.findById(item).exec();
        })
      ).then(wishlistItems => {
        // all found items here
        res.render("pages/wishlist/viewWishlist", {
          wishlist,
          wishlistItems,
          user: req.user
        });
      });
    }
  });
});

router.post("/addlist", authCheck, async (req, res) => {
  const item_id = req.body.id;
  const list_id = { _id: req.body.list };
  // Add item to wishlist
  await Wishlist.updateOne(list_id, { $push: { items: item_id } });

  // Redirect to wishlist view
  res.redirect(`/wishlist/view/?wishlistID=${req.body.list}`);
});

router.post(
  "/deleteItem/:wishlistID/:itemID",
  authCheck,
  ownerCheck,
  async (req, res) => {
    let wishlistID = req.params.wishlistID;
    let itemID = req.params.itemID;

    await Wishlist.findById(wishlistID).then(wishlist => {
      if (wishlist) {
        wishlist.items.pull(itemID);
        wishlist.save();
      }
    });

    // Redirect to wishlist view
    res.redirect(`/wishlist/view/?wishlistID=${wishlistID}`);
  }
);

module.exports = router;
