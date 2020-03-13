const router = require("express").Router();

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

module.exports = router;
