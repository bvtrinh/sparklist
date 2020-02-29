const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

// Routes
const items = require('./routes/item');
const users = require('./routes/user');

const app = express();

// Body parser middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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


// Use routes
app.use('/item', items);
app.use('/user', users);

app.get('/', (req, res) => {
	const sendObj = {
		msg: 'Hello World!',
	};

	res.render('pages/home', sendObj);
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
