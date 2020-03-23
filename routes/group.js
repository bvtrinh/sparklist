const router = require("express").Router();
const tokenfield = require("bootstrap-tokenfield-jquery3");
const sendEmail = require("../scripts/email/");
const path = require("path");
require("dotenv").config(path.join(__dirname, "../.env"));
// Models
const User = require("../models/User");
const Group = require("../models/Group");

const authCheck = (req, res, next) => {
  if (!req.user) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

async function removeWishlists(deletedMembers, groupID) {
  const results = await Group.findById(groupID, { wishlists: 1 }).populate({
    path: "wishlists",
    match: { owner: deletedMembers },
    select: "_id"
  });
  const ids = results.wishlists;
  if (ids.length > 0) {
    var idArr = [];
    ids.forEach(item => {
      idArr.push(item._id);
    });
    const res = await Group.updateOne(
      { _id: groupID },
      { $pull: { wishlists: { $in: idArr } } }
    );
  }
}

const sendNotification = async (newInvites, fullname, groupname) => {
  // Send email notification to groups
  let link = `${process.env.DOMAIN_LINK}/group`;

  const params = {
    fullname,
    groupname,
    link
  };

  await sendEmail({
    template: "grpnotify",
    params: params,
    email: newInvites,
    subject: `${fullname} invited you to the group ${groupname}`,
    from: fullname
  });
};

router.get("/create", authCheck, (req, res) => {
  res.render("pages/group/createGroup", { user: req.user });
});

// handle group creation
router.post("/create", authCheck, (req, res) => {
  const { groupName, invites, visibility } = req.body;
  let errors = [];

  if (!groupName) {
    errors.push({ msg: "Please enter group name" });
  }

  if (!visibility) {
    errors.push({ msg: "Please select a visibility level" });
  }

  if (errors.length > 0) {
    res.render("pages/group/createGroup", {
      errors,
      groupName,
      invites,
      visibility
    });
  } else {
    // initial validation passed
    // check if user has group with same name
    Group.find({ admin: req.user.email, name: groupName }).then(group => {
      if (group.length != 0) {
        // user already has group with entered name -> error
        errors.push({
          msg:
            "You already created a group with this name. Please try again with a different name."
        });
        res.render("pages/group/createGroup", {
          user: req.user,
          errors,
          invites,
          visibility
        });
      } else {
        const fullname = `${req.user.fname} ${req.user.lname}`;
        sendNotification(invites, fullname, groupName);
        new Group({
          name: groupName,
          admin: req.user.email,
          visibility: visibility,
          members: invites
        })
          .save()
          .then(newGroup => {
            res.redirect("/group");
          });
      }
    });
  }
});

router.post("/update/", authCheck, (req, res) => {
  const { groupName, members, visibility } = req.body;
  let groupID = req.query.groupID;
  var memberList = [];
  if (members !== "") {
    memberList = members.trim().split(",");
    // When submitting the form without any changes the string will split on the comma
    // and add another element to the memberList array
    if (memberList[memberList.length - 1] === "") {
      memberList.pop();
    }
  }

  Group.findById(groupID).then(group => {
    if (group) {
      if (groupName != group.name) {
        group.name = groupName;
        // Group.update({_id: groupID}, {name: groupName});
      }

      if (visibility != group.visibility) {
        group.visibility = visibility;
        // Group.update({_id: groupID}, {visibility: visibility})
      }

      if (members != group.members) {
        // Group.update({_id: groupID}, {members: members})
        var oldMembers = group.members;
        group.members = members;
        group.members = [];

        memberList.forEach(function(user, index) {
          group.members.push(user.trim());
        });

        const fullname = `${req.user.fname} ${req.user.lname}`;
        // MemberList contains the newly entered users
        // newMembers contains the diff between newly entered users and the old members
        var newMembers = memberList.filter(member => {
          return !oldMembers.includes(member);
        });

        // Contains the members that were removed from the memberList
        // Now deleted their corresponding wishlist
        var deletedMembers = oldMembers.filter(member => {
          return !memberList.includes(member);
        });

        if (deletedMembers.length > 0) {
          removeWishlists(deletedMembers, groupID);
        }

        if (newMembers.length > 0) {
          sendNotification(newMembers, fullname, group.name);
        }
      }

      group.save();
    }
  });

  res.redirect("/group/manage/?groupID=" + groupID);
});

router.post("/delete/", (req, res) => {
  let groupID = req.query.groupID;
  Group.findOneAndDelete({ _id: groupID }, function(err) {
    if (err) console.log(err);
    res.redirect("/group");
  });
});

router.get("/", authCheck, (req, res) => {
  // find all groups associated with this user
  Group.find({
    $or: [{ admin: req.user.email }, { members: req.user.email }]
  }).then(groups => {
    if (groups.length == 0) {
      // user does not belong to any groups
      // add some type of message
      res.render("pages/group/listGroup", {
        user: req.user,
        msg: "You do not have any groups.",
        sharedGrps: "",
        myGrps: ""
      });
    } else {
      const sharedGrps = groups.filter(grp => grp.admin !== req.user.email);
      const myGrps = groups.filter(grp => grp.admin === req.user.email);
      res.render("pages/group/listGroup", {
        user: req.user,
        msg: "",
        sharedGrps,
        myGrps
      });
    }
  });
});

router.get("/manage/", authCheck, (req, res) => {
  let groupID = req.query.groupID;
  Group.findById(groupID).then(group => {
    if (group) {
      res.render("pages/group/updateGroup", { group, user: req.user });
    }
  });
});

router.post("/groupinfo", async (req, res) => {
  const groupID = req.body.id;

  const { id, name, admin } = await Group.findById(groupID);

  return res.json({ id, name, admin });
});

router.post("/leavegrp/:id", async (req, res) => {
  const groupID = req.params.id;

  console.log(req.user.email);
  try {
    const results = await Group.updateOne(
      { _id: groupID },
      { $pull: { members: `${req.user.email}` } }
    );

    var deletedMembers = [req.user.email];
    removeWishlists(deletedMembers, groupID);

    return res.json({ status: 0 });
  } catch (err) {
    return res.json({ status: 1 });
  }
});

router.post("/addlist", async (req, res) => {
  const groupID = req.body.groupID;
  const wishlistID = req.body.wishlistID;

  try {
    // Remove any existing wishlists first
    const results = await Group.findById(groupID).populate({
      path: "wishlists",
      match: { owner: req.user.email },
      select: "_id"
    });

    const ids = results.wishlists;
    if (ids.length > 0) {
      var idArr = [];
      ids.forEach(item => {
        idArr.push(item._id);
      });
      await Group.updateOne(
        { _id: groupID },
        { $pull: { wishlists: { $in: idArr } } }
      );
    }

    // Add the updated binded wishlist
    await Group.updateOne(
      { _id: groupID },
      {
        $addToSet: { wishlists: wishlistID }
      }
    );
    return res.json({ status: 0 });
  } catch (err) {
    return res.json({ status: 1, msg: err });
  }
});

router.get("/view/:groupID", authCheck, async (req, res) => {
  const groupID = req.params.groupID;

  const results = await Group.findById(groupID).populate("wishlists");
  console.log(results);

  res.render("pages/group/viewGroup", results);
});

module.exports = router;
