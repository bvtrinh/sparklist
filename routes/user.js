const router = require('express').Router();
const bcrypt = require('bcryptjs');
require('dotenv').config();

const saltRounds = 10;

// User Model
const User = require('../models/User');


function userExists(req, res, next){
    User.find({email: req.body.email}, function(err, docs) {
		if (docs.length){
            // user already exists, display error
            res.redirect('pages/register', {failed: true});
		}else{
            // user with entered email does not exist
            // create user
            next(req, res);
        }
    });
}

function addUser(req, res) {
    bcrypt.hash(req.body.password, saltRounds, function (err,   hash) {
        var user = {
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            password: hash
        };

        var newUser = new User(user);

        newUser.save()
        .then(item => {
            // should render homepage or myaccount page once implemented
            res.send("item saved to database");
        })
        .catch(err => {
            res.status(400).send("unable to save to database");
        });
    });
}

router.post('/create', (req, res) => {
    userExists(req, res, addUser);
});

router.post('/auth', (req, res) => {
    User.findOne({email: req.body.email}, function(err, user) {
		if (user){
            // user exists
            bcrypt.compare(req.body.password, user.password, function(err, result) {
                if(result){
                    var loginMsg = "Successfully logged in as " + req.body.email;
                    res.redirect('/');
                } else {
                    res.render('pages/login', {failed: true});
                }
            });
        }else{
            // user does not exist
            res.render('pages/login', {failed: true});

        }
    });
});




module.exports = router;
