const mongoose = require('mongoose');
const	Schema = mongoose.Schema;
const	Meeting = require('./schemas/meeting.js');
const MeetingTest = require('./schemas/meeting.test.js');
module.exports = { Meeting, MeetingTest };
