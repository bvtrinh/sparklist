const router = require("express").Router();
const tokenfield = require("bootstrap-tokenfield-jquery3");

// Models
const User = require("../models/User");
const Group = require("../models/Group");

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

router.get("/create", authCheck, (req, res) => {
  const user = getUserInfo(req);
  res.render("pages/group/createGroup", { user });
});

// handle group creation
router.post("/create", authCheck, (req, res) => {
  const user = getUserInfo(req);

  const { groupName, invites, visibility } = req.body;
  let errors = [];

  if (!groupName) {
    errors.push({ msg: "Please enter group name" });
  }

  if (!visibility) {
    errors.push({ msg: "Please select a visibility level" });
  }

  if (errors.length > 0) {
    res.render("pages/group/viewGroup", {
      errors,
      groupName,
      invites,
      visibility
    });
  } else {
    // initial validation passed
    // check if user has group with same name
    Group.find({
      admin: req.session.passport.user.email,
      name: groupName
    }).then(group => {
      if (group.length != 0) {
        // user already has group with entered name -> error
        errors.push({
          msg:
            "You already created a group with this name. Please try again with a different name."
        });
        res.render("pages/group/createGroup", {
          user,
          errors,
          invites,
          visibility
        });
      } else {
        new Group({
          name: groupName,
          admin: req.session.passport.user.email,
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

router.post("/update/", (req, res) => {
  const { groupName, members, visibility } = req.body;
  let groupID = req.query.groupID;

  Group.findById(groupID).then(group => {
    if (group) {
      if (groupName != group.name) {
        group.name = groupName;
        // Group.update({_id: groupID}, {name: groupName});
      }

      if (members != group.members) {
        group.members = members;
        // Group.update({_id: groupID}, {members: members})
      }

      if (visibility != group.visibility) {
        group.visibility = visibility;
        // Group.update({_id: groupID}, {visibility: visibility})
      }
      group.save();
    }
  });

  res.redirect("/group/manage/?groupID=" + groupID);
});

router.post("/delete/", authCheck, (req, res) => {
  let groupID = req.query.groupID;
  Group.findOneAndDelete({ _id: groupID }, function(err) {
    if (err) console.log(err);
    res.redirect("/group");
  });
});

router.get("/", authCheck, (req, res) => {
  // find all groups associated with this user
  Group.find({
    $or: [
      { admin: req.session.passport.user.email },
      { members: req.session.passport.user.email }
    ]
  }).then(groups => {
    if (groups.length == 0) {
      // user does not belong to any groups
      // add some type of message
      res.render("pages/group/viewGroup", {
        user: req.session.passport.user,
        msg: "You do not have any groups.",
        groups: groups
      });
    } else {
      res.render("pages/group/viewGroup", {
        user: req.session.passport.user,
        msg: "",
        groups: groups
      });
    }
  });
});

router.get("/manage/", authCheck, (req, res) => {
  let groupID = req.query.groupID;
  Group.findById(groupID).then(group => {
    if (group) {
      res.render("pages/group/updateGroup", {
        group,
        user: req.session.passport.user
      });
    }
  });
});

module.exports = router;
