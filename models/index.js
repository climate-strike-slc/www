const mongoose = require('mongoose');
const	Schema = mongoose.Schema;
const	Meeting = mongoose.model('Meeting', require('./schemas/meeting.js'));
const MeetingTest = mongoose.model('MeetingTest', require('./schemas/meeting.test.js'));
module.exports = { Meeting, MeetingTest };
