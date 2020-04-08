const config = require('../config');
// const request = require('request')

const testenv = config.testenv;
const { Content, ContentTest } = require('../../models');
const ContentDB = (!testenv ? Content : ContentTest);
function deleteMeeting(id, token, next) {
	ContentDB.deleteOne({_id: id}, (err, doc) => {
		if (err) {
			return next(err)
		}
		return next()
	})
}
module.exports = { deleteMeeting }