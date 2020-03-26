const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const Users = require("../models/User");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Users.findById(id).then(user => {
    done(null, {
      _id: user._id,
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      date: user.date
    });
  });
});

passport.use(
  new GoogleStrategy(
    {
      callbackURL: "https://sparklist.me/auth/google/redirect",
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    (accessToken, refreshToken, userData, done) => {
      // passport callback function
      // check if user exists
      User.findOne({ email: userData.emails[0].value }).then(currentUser => {
        if (currentUser) {
          // user
          console.log("current user: " + currentUser);
          done(null, currentUser);
        } else {
          // create user in db
          new User({
            fname: userData.name.givenName,
            lname: userData.name.familyName,
            email: userData.emails[0].value
          })
            .save()
            .then(newUser => {
              console.log("new user created: " + newUser);
              done(null, newUser);
            });
        }
      });
    }
  )
);

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    // Check if user exists
    User.findOne({ email: email })
      .then(user => {
        if (!user) {
          return done(null, false, { message: "User not found." });
        }
        // Check password
        bcrypt.compare(password, user.password, function(err, result) {
          if (err) throw err;

          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password." });
          }
        });
      })
      .catch(err => console.log(err));
  })
);
