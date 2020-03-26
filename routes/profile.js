const router = require("express").Router();

const authCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

router.get("/", authCheck, (req, res) => {
  // var username = req.session.passport.user.fname + ' ' + req.session.passport.user.lname;
  res.render("pages/user/profile", { user: req.session.passport.user });
  // res.render('pages/login', {failed: true});
});

module.exports = router;
