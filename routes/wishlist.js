const router = require('express').Router();
const tokenfield = require("bootstrap-tokenfield-jquery3")

// Models
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');

const authCheck = (req, res, next) => {
    if(!req.user){
        // user not logged in
        res.redirect('/login');
    } else {
        // user logged in
        next();
    }
}

router.get('/create', authCheck, (req, res) => {
    res.render('pages/createWishlist');
});

// handle wishlist creation
router.post('/create', authCheck, (req, res) => {
    const {wishlistName, visibility} = req.body;
    let errors = [];

    if(!wishlistName){
        errors.push({msg: 'Please enter wishlist name'});
    }

    if(!visibility){
        errors.push({msg: 'Please select a visibility level'});
    }

    if(errors.length > 0) {
        res.render('pages/createWishlist', {
            errors,
            wishlistName,
            invites,
            visibility
        });
    } else {
        // initial validation passed
        // check if user has wishlist with same name

        Wishlist.find({owner: req.user.email, name: wishlistName})
            .then(wishlist => {
                if (wishlist.length != 0) {
                    // user already has wishlist with entered name -> error
                    errors.push({msg: "You already created a wishlist with this name. Please try again with a different name."});
                    res.render('pages/createWishlist', {
                        errors,
                        visibility
                    });
                } else {
                    new Wishlist ({
                        name: wishlistName,
                        owner: req.user.email,
                        visibility: visibility
                    }).save().then((newWishlist) => {
                        res.redirect('/wishlist');
                    });
                }
            });
    }
});

router.post('/update/', authCheck, (req, res) => {
    const {wishlistName, sharedUsers, visibility} = req.body;
    let wishlistID = req.query.wishlistID;

    var usersList = sharedUsers.trim().split(',')

    // console.log(usersList);
    // usersList.forEach(function (item, index) {
    //     console.log(item, index);
    //   });
    
    Wishlist.findById(wishlistID)
        .then(wishlist => {
            if(wishlist){
                if(wishlistName != wishlist.name){
                    wishlist.name = wishlistName;
                }

                // var members = wishlist.sharedUsers;
                // members.forEach(function(member, index) {
                //     console.log(member);
                // });
                wishlist.sharedUsers = [];

                // if(sharedUsers != wishlist.sharedUsers) {
                    usersList.forEach(function(user, index) {
                        // if(!members.includes(user)){
                            wishlist.sharedUsers.push(user.trim());
                        // }
                    })

                    // wishlist.sharedUsers = sharedUsers;
                // }

                if(visibility != undefined && visibility != wishlist.visibility) {
                    wishlist.visibility = visibility;
                }
                wishlist.save();
            }
        });
    
        res.redirect('/wishlist/manage/?wishlistID='+wishlistID);    
})

router.post('/delete/', authCheck, (req, res) => {
    let wishlistID = req.query.wishlistID;
    Wishlist.findOneAndDelete({ _id: wishlistID }, function (err) {
        if(err) console.log(err);
        res.redirect('/wishlist');
      });
});

router.get('/', authCheck, (req, res) => {
    // find all wishlists associated with this user
    Wishlist.find({$or:[ {owner:req.user.email}, {sharedUsers: req.user.email}]})
        .then(wishlists => {
            if (wishlists.length == 0) {
                // user does not belong to any wishlists
                // add some type of message
                res.render('pages/wishlist', {
                    msg: "You do not have any wishlists.", 
                    wishlists: wishlists
                });
            } else {
                res.render('pages/wishlist', {
                    msg: '', 
                    wishlists: wishlists
                });
            }
        });
});

router.get('/manage/', authCheck, (req, res) => {
    let wishlistID = req.query.wishlistID;
    Wishlist.findById(wishlistID)
        .then(wishlist => {
            if(wishlist){
                res.render('pages/updateWishlist', { wishlist });
            }
        });
});

module.exports = router;
