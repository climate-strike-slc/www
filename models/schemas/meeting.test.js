var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
const MeetingTest = new Schema({
	uuid: String,
  id: Number,
  host_id: String,
  topic: String,
  type: Number,
  status: String,
  start_time: Date,
  duration: Number,
  timezone: String,
  agenda: String,
  created_at: Date,
  start_url: String,
  join_url: String
}, {collection: 'meetingstest'});
module.exports = MeetingTest;
