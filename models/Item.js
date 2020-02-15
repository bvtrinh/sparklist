const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema
const item_schema = new Schema({
	name: {
		type: String,
		require: true,
	},
	date: {
		type: Date,
		default: Date.now,
	},
});

module.exports = Item = mongoose.model('item', item_schema);
