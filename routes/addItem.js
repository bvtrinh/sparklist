const PriceFinder = require('price-finder');
const priceFinder = new PriceFinder();
const router = require('express').Router();


router.get('/', (req, res) => {

    res.render('pages/addItemPage');


});


router.get('/confirmation',(req, res) => {

	res.render('pages/addItemConfirmation')
	console.log("confirm")

});


router.post('/', (req, res) => {
	console.log(req.body);
	uri = req.body.URL;


	priceFinder.findItemDetails(uri, function(err, itemDetails) {


		const new_item = new Item({
			title: itemDetails.name,
			price_hist: {price:itemDetails.price, date: Date().toString()},
			category: itemDetails.category,
			url:uri,
		});

		new_item.save().then((item) => res.render('pages/addItemConfirmation',new_item));

    });



});



module.exports = router;