var MongoClient = require('mongodb').MongoClient;
const router = require('express').Router();
const mongoose = require('mongoose');
const db = process.env.MONGOURI;


const Items = require('../models/Item');

// mongoose.connect('mongodb://localhost/test');

router.get('/', (req, res) => {

    res.render('pages/searchDBPage');


});

router.post('/', (req, res) => {
	console.log(req.body);
	itemName = req.body.itemName;

    console.log("searching for " + itemName);

    Items.find({title: new RegExp (itemName, 'i')}).then(items=>{

        if(items)
        {

        
            console.log(items);

        
            res.render('pages/searchResults', {items});
        }

        

    });

});



module.exports = router;