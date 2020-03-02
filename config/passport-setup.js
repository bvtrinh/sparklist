const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Users = require('../models/User')
require('dotenv').config();

passport.serializeUser((user, done) => {
    done(null, user.id)
});

passport.deserializeUser((id, done) => {
    Users.findById(id).then((user) => {
        done(null, user);
    });
});

passport.use(
    new GoogleStrategy({
        callbackURL: '/auth/google/redirect',
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }, (accessToken, refreshToken, userData, done)=> {
        // passport callback function
        // check if user exists
        User.findOne({email: userData.emails[0].value}).then((currentUser) => {
            if(currentUser){
                // user 
                console.log('current user: ' + currentUser);
                done(null, currentUser);
            } else {
                // create user in db
                new User({
                    fname: userData.name.givenName,
                    lname: userData.name.familyName,
                    email: userData.emails[0].value
                }).save().then((newUser) => {
                    console.log('new user created: ' + newUser);
                    done(null, newUser);
                })
            }
        });
    })
); 