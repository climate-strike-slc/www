var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
const GroupTest = new Schema({
	name: String,
  total_members: Number,
  id: String,
	memberids: [String]
}, {collection: 'groupstest'});
module.exports = mongoose.model('GroupTest', GroupTest)
