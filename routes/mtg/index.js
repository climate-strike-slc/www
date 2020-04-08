require('dotenv').config()
const express = require('express');
const url = require('url');
const router = express.Router();
const config = require('../../utils/config');
// const request = require('request')
const { ensureAuthenticated, sessionReferrer } = require('../../utils/middleware');

const testenv = config.testenv;
const { Content, ContentTest } = require('../../models');
const ContentDB = (!testenv ? Content : ContentTest);

router.all(/(.+)/, ensureAuthenticated)

// router.get('/meetings', async (req, res, next) => {
// 	// console.log(req.cookies)
// 	const meetings = await ContentDB.find({}).then(data=>data).catch(err=>next(err));
// 	return res.render('meetings', {
// 		pu: req.user,
// 		admin: req.session.admin,
// 		data: meetings
// 	})
// });

router.get('/jitsi', async (req, res, next) => {
	// console.log(req.cookies)
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	const meetings = await ContentDB.find({}).then(data=>data).catch(err=>next(err));
	return res.render('jitsi', {
		pu: req.user,
		admin: req.session.admin,
		data: meetings
	})
});

router.post('/jitsi', async(req, res, next) => {
	const meetings = await ContentDB.find({}).then(data=>data).catch(err=>next(err));
	return res.status(200).send(meetings)
})

module.exports = router;