const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");

const saltRounds = 10;

const authCheck = (req, res, next) => {
  if (req.user) {
    // user not logged in
    res.redirect("/");
  } else {
    // user logged in
    next();
  }
};
// User Model
const User = require("../models/User");

router.get("/login", authCheck, (req, res) => {
  res.render("pages/user/login");
});

router.get("/register", authCheck, (req, res) => {
  res.render("pages/user/register");
});

// handle registeration
router.post("/register", (req, res) => {
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

module.exports = router;
