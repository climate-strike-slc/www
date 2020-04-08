var mongoose = require('mongoose'),
		Publisher = require('mongoose-geojson-schema'),
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
	properties: {
		avatar: String,
		admin: Boolean,
		givenName: String,
		time: {
			begin: Date,
			end: Date
		}
	}
	
}, { collection: 'soclogin' });
schema.index({ geometry: '2dsphere' });
schema.plugin(passportLocalMongoose);

module.exports = mongoose.model('Publisher', schema);