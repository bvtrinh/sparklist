const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportSetup = require('./config/passport-setup');
const flash = require('connect-flash');
require('dotenv').config();

// Routes
const items = require('./routes/item');
const users = require('./routes/user');
const auth  = require('./routes/auth');
const profile  = require('./routes/profile');


const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Express session
app.use(session({
	// expire after 1 day
	maxAge: 24 * 60 * 60 * 1000,
	resave: true,
  	saveUninitialized: true,
	secret: 'sparklistsecret'
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// DB Config
const db = process.env.MONGOURI;

// Connect to Mongo
mongoose
	.connect(db, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})
	.then(() => console.log('MongoDB Connected...'))
	.catch((err) => console.log(err));

// Global Vars
app.use((req, res, next) => {
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	next();
});


// Use routes
app.use('/item', items);
app.use('/user', users);
app.use('/auth', auth); 
app.use('/profile', profile); 


app.get('/', (req, res) => {
	res.render('pages/home', {user: req.user});
});

app.get('/login', (req, res) => {
	res.render('pages/login', {failed: false});
});

app.get('/register', (req, res) => {
	res.render('pages/register', {failed: false});
});

console.log('Running on ' + process.env.NODE_ENV);

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server started on port ${port}`));
