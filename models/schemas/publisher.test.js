var mongoose = require('mongoose'),
		PublisherTest = require('mongoose-geojson-schema'),
		Schema = mongoose.Schema,
		passportLocalMongoose = require('passport-local-mongoose');

var schema = new Schema({
	username: {
		type: String,
		unique: true,
		trim: true
	},
	password: String,
	language: String,
	email: String,
	geometry: Schema.Types.GeoJSON,
	slack: {
		oauthID: String
	},
	avatar: String,
	admin: Boolean,
	givenName: String,
	time: {
		begin: Date,
		end: Date
	}
	
}, { collection: 'soclogintest' });
schema.index({ geometry: '2dsphere' });
schema.plugin(passportLocalMongoose);

module.exports = mongoose.model('PublisherTest', schema);