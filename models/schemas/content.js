var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
const Content = new Schema({
	puid: String,
	topic: String,
	status: String,
	start_time: Date,
	title: String,
	description: String,
	created_at: Date,
	start_url: String,
	join_url: String
}, {collection: 'content'});
module.exports = mongoose.model('Content', Content)