const router = require("express").Router();
const passport = require("passport");

// local login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/user/login",
    failureFlash: true
  })(req, res, next);
});

// logout
router.get("/logout", (req, res) => {
  // handle with passport
  req.logout();
  res.redirect("/");
});

// authenticate with google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

// google redirect callback
router.get("/google/redirect", passport.authenticate("google"), (req, res) => {
  res.redirect("/");
});

module.exports = router;
