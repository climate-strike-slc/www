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

router.all(/(.+)/, ensureAuthenticated)

router.get('/profile', csrfProtection, async (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	res.cookie('XSRF-TOKEN', req.csrfToken())
	const user = await PublisherDB.findOne({_id: req.session.userId}).then(pu=>pu).catch(err=>next(err));
	// console.log(user)
	return res.render('profile', {
		csrfToken: req.csrfToken(),
		pu: user
	})
})

router.post('/profile/:id', upload.array(), parseBody, csrfProtection, async(req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'POST');
	const id = req.session.userId;
	if (!id) return res.redirect('/login');
	const keys = Object.keys(req.body);
	await keys.forEach(async(key) => {
		const set = {$set:{}};
		set.$set[key] = req.body[key];
		await PublisherDB.findOneAndUpdate({_id: req.params.id}, set, {safe:true}).then(pu=>{}).catch(err=>next(err));
	})
	return res.redirect('/usr/profile')
})

router.post('/deleteProfile/:id', async(req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'POST');
	PublisherDB.deleteOne({_id: req.params.id}, (err, pu) => {
		PublisherDB.find({}).lean().exec((err, users) => {
			if (err) {
				return next(err)
			} else {
				return res.status(200).send(users)
			}
			
		})
	})
})

router.post('/checkAdmin/:userid', async (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'POST');
	const userId = decodeURIComponent(req.params.userid);
	const user = await PublisherDB.findOne({_id: req.params.userid}).then(pu=>pu).catch(err=>next(err));
	let amIAdmin = false;
	if (user) {
		amIAdmin = (!user.admin ? false : true)
	} else {
		amIAdmin = false;
	}
	return res.status(200).send(amIAdmin)
})

module.exports = router;