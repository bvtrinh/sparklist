const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const passport = require("passport");
const passportSetup = require("./config/passport-setup");
const flash = require("connect-flash");
const path = require("path");
const cors = require("cors");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Models for featured items
const Item = require("./models/Item");

// Routes
const items = require("./routes/item");
const users = require("./routes/user");
const auth = require("./routes/auth");
const group = require("./routes/group");
const wishlist = require("./routes/wishlist");

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Connect to Mongo
mongoose
  .connect(process.env.MONGOURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(err));

// Express session
app.use(
  session({
    // expire after 1 day
    maxAge: 24 * 60 * 60 * 1000,
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
    secret: process.env.SESSION_SECRET,
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global Vars
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Use routes
app.use("/item", items);
app.use("/user", users);
app.use("/auth", auth);
app.use("/group", group);
app.use("/wishlist", wishlist);

const authCheck = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // user not logged in
    res.redirect("/user/login");
  } else {
    // user logged in
    next();
  }
};

app.get("/", (req, res) => {
  const user = req.isAuthenticated() ? req.session.passport.user : undefined;
  Item.find()
    .sort({ count: -1 })
    .limit(4)
    .then((items) => {
      return res.render("pages/home", {
        user,
        items,
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/error", authCheck, (req, res) => {
  return res.render("pages/error", { user: req.session.passport.user });
});

console.log("Running on " + process.env.NODE_ENV);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
