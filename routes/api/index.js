require('dotenv').config()
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment');
const multer = require('multer');
const rp = require('request-promise');
const passport = require('passport');
const url = require('url');
const upload = multer({fieldSize: 25 * 1024 * 1024});
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const csrf = require('csurf');
const csrfProtection = csrf({cookie:true});
const { getMe, ensureAdmin, ensureAuthenticated, sessionAdmin, sessionReferrer } = require('../../utils/middleware');
const { deleteMeeting } = require('../../utils/helpers');
const config = require('../../utils/config');
// const request = require('request')

const testenv = config.testenv;
const { Content, ContentTest, Publisher, PublisherTest } = require('../../models');
const PublisherDB = (!testenv ? Publisher : PublisherTest);
const ContentDB = (!testenv ? Content : ContentTest);

router.all(/(.+)/, ensureAuthenticated, ensureAdmin)

router.post('/users', async (req, res, next) => {
	const users = await PublisherDB.find({}).then(data=>data).catch(err=>next(err));
	return res.status(200).send(users);
})

router.get('/createMeeting', csrfProtection, function(req, res) {
	res.cookie('XSRF-TOKEN', req.csrfToken())
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	// console.log(res.header['xsrf-token'])
	res.render('edit', {
		pu: req.user,
		menu: 'new',
		admin: req.session.admin,
		csrfToken: req.csrfToken(),
		title: 'Manage Meetings'
	});
});

router.post('/createMeeting', upload.array(), parseBody, csrfProtection, async function(req, res, next) {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'POST');
	const meeting = new ContentDB(req.body);
	meeting.save(err => {
		if (err) {
			return next(err)
		} else {
			
			return res.redirect('/mtg/jitsi')
		}
	});
});

router.get('/editMeeting/:id', csrfProtection, async (req, res, next) => {
	res.cookie('XSRF-TOKEN', req.csrfToken())
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	const meetingId = req.params.id;
	const doc = await ContentDB.findOne({_id: meetingId}).then(doc=>doc).catch(err=>next(err));
	return res.render('edit', {
		pu: req.user,
		menu: 'edit',
		admin: req.session.admin,
		csrfToken: req.csrfToken(),
		doc: doc
	})
})

router.post('/editMeeting/:id', upload.array(), parseBody, csrfProtection, async function(req, res, next) {
	const outputPath = url.parse(req.url).pathname;
	const keys = Object.keys(req.body);
	await keys.forEach(async(key) => {
		const set = {$set:{}};
		set.$set[key] = req.body[key];
		await ContentDB.findOneAndUpdate({_id: req.params.id}, set, {safe:true}).then(pu=>{}).catch(err=>next(err));
	})
	return res.redirect('/mtg/jitsi')
});

router.all('/deleteMeeting/:id', async(req, res, next) => {
	ContentDB.deleteOne({_id: req.params.id}, (err, doc) => {
		if (err) {
			return next(err)
		}
		return res.redirect('/mtg/jitsi')
	})
})

module.exports = router;