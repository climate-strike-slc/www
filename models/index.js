var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
	
var Meeting = new Schema({
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
}, {collection: 'meetings'})
module.exports = mongoose.model('Meeting', Meeting);
