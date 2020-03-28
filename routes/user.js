const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

const saltRounds = 10;

const loggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    // user logged in
    res.redirect("/");
  } else {
    // user not logged in
    next();
  }
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

// User Model
const User = require("../models/User");

router.get("/login", loggedIn, (req, res) => {
  res.render("pages/user/login");
});

router.get("/register", loggedIn, (req, res) => {
  res.render("pages/user/register");
});

// handle registeration
router.post("/register", loggedIn, (req, res) => {
  const { fname, lname, email, password, passwordConfirm } = req.body;
  let errors = [];

  // check required fields
  if (!fname || !lname || !email || !password || !passwordConfirm) {
    errors.push({ msg: "Please fill in all fields" });
  }

  // Check passwords match
  if (password !== passwordConfirm) {
    errors.push({ msg: "Passwords do not match" });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: "Password should be atleast 6 characters long." });
  }

  if (errors.length > 0) {
    res.render("pages/user/register", {
      errors,
      fname,
      lname,
      email,
      password,
      passwordConfirm
    });
  } else {
    // validation passed
    // check if user exists, create new user if doesnt exist
    User.findOne({ email: email }).then(user => {
      if (user) {
        // user exists, redirect to register page
        errors.push({
          msg: "User with entered email already exists. Please try again."
        });
        res.render("pages/user/register", {
          errors,
          fname,
          lname,
          email,
          password,
          passwordConfirm
        });
      } else {
        bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
          new User({
            fname: fname,
            lname: lname,
            email: email,
            password: hash
          })
            .save()
            .then(newUser => {
              // res.send("item saved to database");
              req.flash(
                "success_msg",
                "You are now registered, please login to continue."
              );
              res.redirect("/user/login");
            })
            .catch(err => {
              res.status(400).send("unable to save to database");
            });
        });
      }
    });
  }
});

router.get("/profile", authCheck, (req, res) => {
  res.render("pages/user/profile", { user: req.session.passport.user });
});

router.get("/update", authCheck, (req, res) => {
  res.render("pages/user/updateProfile", { user: req.session.passport.user });
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
    res.redirect("/user/profile");
  });
});

router.get("/updatePassword", authCheck, (req, res) => {
  res.render("pages/user/updatePassword", { user: req.session.passport.user });
});

router.post("/updatePassword", authCheck, (req, res) => {
  const { oldPassword, password, confirmPassword } = req.body;
  let userID = req.query.userID;
  let errors = [];

  User.findById(userID).then(user => {
    if (user) {
      // Check old password matches
      bcrypt.compare(oldPassword, user.password, function(err, result) {
        if (result == false) {
          errors.push({ msg: "Old Password is incorrect." });
        }
        // Check new passwords match
        if (password !== confirmPassword) {
          errors.push({ msg: "New passwords do not match." });
        }

        // Check new password length
        if (password.length < 6) {
          errors.push({ msg: "Password should be atleast 6 characters long." });
        }

        if (errors.length > 0) {
          res.render("pages/user/updatePassword", {
            errors,
            user: req.session.passport.user
          });
        } else {
          bcrypt.hash(password, saltRounds, function(err, hash) {
            user.password = hash;
            user.save();
            res.redirect("/user/profile");
          });
        }
      });
    }
  });
});

module.exports = router;
