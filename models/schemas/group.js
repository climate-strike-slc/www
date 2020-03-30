var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
const Group = new Schema({
	name: String,
  total_members: Number,
  id: String,
	memberids: [String]
}, {collection: 'groups'});
module.exports = mongoose.model('Group', Group)
