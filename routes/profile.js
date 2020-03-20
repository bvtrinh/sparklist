const router = require("express").Router();
const bcrypt = require("bcryptjs");
const saltRounds = 10;

// User Model
const User = require("../models/User");

const authCheck = (req, res, next) => {
  if (!req.user) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

router.get("/", authCheck, (req, res) => {
  // var username = req.user.fname + ' ' + req.user.lname;
  res.render("pages/user/profile", { user: req.user });
  // res.render('pages/login', {failed: true});
});

router.get("/update", authCheck, (req, res) => {
  res.render("pages/user/updateProfile", { user: req.user });
});

router.post("/update", authCheck, (req, res) => {
  const { fname, lname, email } = req.body;
  let userID = req.query.userID;

  User.findById(userID).then(user => {
    if (user) {
      if (fname != user.fname) {
        user.fname = fname;
      }

      if (lname != user.lname) {
        user.lname = lname;
      }

      if (email != user.email) {
        user.email = email;
      }
      user.save();
    }
  });

  res.redirect("/");
});

router.get("/updatePassword", authCheck, (req, res) => {
  res.render("pages/user/updatePassword", { user: req.user });
});

router.post("/updatePassword", authCheck, (req, res) => {
  const { oldPassword, password, confirmPassword } = req.body;
  let userID = req.query.userID;
  let errors = [];

  User.findById(userID).then(user => {
    if (user) {    

      // Check old password matches
      bcrypt.compare(oldPassword, user.password, function(err, result) {
        if(result == false) {
          errors.push({msg: "Old Password is incorrect."})
        }
        // Check new passwords match
        if (password !== confirmPassword) {
          errors.push({msg: "New passwords do not match."});
        }

        // Check new password length
        if(password.length < 6) {
          errors.push({ msg: "Password should be atleast 6 characters long." });
        }

        if(errors.length > 0) {
          res.render("pages/user/updatePassword", { errors, user: req.user });
        } else {
          bcrypt.hash(password, saltRounds, function(err, hash) {
            user.password = hash;
            user.save();
            res.redirect("/");
          });
        }
      });      
    }
  });

});

module.exports = router;
