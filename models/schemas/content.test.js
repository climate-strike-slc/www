var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
const ContentTest = new Schema({
	puid: String,
	scheduleId: String,
	topic: String,
	status: String,
	start_time: Date,
	title: String,
	description: String,
	created_at: Date,
	start_url: String,
	join_url: String
}, {collection: 'contenttest'});
module.exports = mongoose.model('ContentTest', ContentTest);