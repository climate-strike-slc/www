require('dotenv').config()
const express = require('express');
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
const { ensureAdmin, ensureAuthenticated, sessionAdmin, sessionReferrer } = require('../utils/middleware');
const { deleteMeeting } = require('../utils/helpers');
const config = require('../utils/config');
// const request = require('request')

const testenv = config.testenv;
const { Content, ContentTest, Publisher, PublisherTest } = require('../models');
const PublisherDB = (!testenv ? Publisher : PublisherTest);
const ContentDB = (!testenv ? Content : ContentTest);

const routes = express.Router();
const router = express.Router();

const api = require('./api');
const mtg = require('./mtg');
const usr = require('./usr');

routes.all(/(.+)/, sessionAdmin, sessionReferrer);

routes.use('/api', api);
routes.use('/mtg', mtg);
routes.use('/usr', usr);


// router.all(/(.+)/, sessionAdmin)

router.all(/(.+)/, sessionAdmin, sessionReferrer);
router.all('/', ensureAuthenticated)

router.get('/auth', csrfProtection, async (req, res, next) => {
	res.cookie('XSRF-TOKEN', req.csrfToken())
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	if (req.isAuthenticated()) {
		var referrer = !req.session.referrer ? '/usr/profile' : req.session.referrer;
		return res.redirect(referrer);
	} else {
		return res.redirect('/login')
	}
})

router.get('/logout', async (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	if (req.session || req.user) {
		await req.session.destroy(err=>req.logout())
	}
	res.clearCookie('token');
	res.clearCookie('refresh');
	res.clearCookie('expires_on');
	return res.redirect('/mtg/jitsi')
})

router.get('/register', csrfProtection, (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// // console.log(outputPath, 'GET');
	res.cookie('XSRF-TOKEN', req.csrfToken())
	return res.render('register', { csrfToken: req.csrfToken(), menu: 'register' } );
})

router.post('/register', upload.array(), parseBody/*, csrfProtection*/, (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'POST');
	var langs = [];
	// console.log(req.body)
	var admin;
	if (
		config.admins.split(/\,\s{0,5}/).indexOf(req.body.username) !== -1 ||
		config.admins.split(/\,\s{0,5}/).indexOf(req.body.email) !== -1
	) {
		admin = true;
	} else {
		admin = false;
	}
	PublisherDB.register(new PublisherDB(
		{ username : req.body.username, 
			/*language: req.body.languages,*/ 
			email: req.body.email, 
			avatar: '/public/images/publish_logo_sq.svg', 
			admin: admin, 
			givenName: req.body.givenName, 
			time: {
				begin: new Date(),
				end: new Date()
			}
		}
	), req.body.password, (err, user) => {
		if (err) {
			return res.render('register', {info: "Sorry. That Name already exists. Try again."});
		}
		req.session.username = req.body.username;
		passport.authenticate('local')(req, res, function () {
			PublisherDB.findOne({username: req.body.username}, function(error, pu){
				if (error) {
					return next(error)
				}
				req.session.userId = pu._id;
				req.session.loggedin = pu.username;
				
				return res.redirect('/usr/profile')
			})
		});
	});

});

router.get('/login', csrfProtection, (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	// console.log(outputPath, 'GET');
	res.cookie('XSRF-TOKEN', req.csrfToken())
	var referrer = req.get('Referrer');
	req.session.referrer = referrer;
	return res.render('login', { 
		csrfToken: req.csrfToken(),
		menu: 'login'
	});
});

router.post('/login', upload.array(), parseBody, csrfProtection, passport.authenticate('local', {
	failureRedirect: '/login'
}), async (req, res, next) => {
	const outputPath = url.parse(req.url).pathname;
	console.log(outputPath, 'POST');
	req.session.userId = req.user._id;
	req.session.loggedin = req.user.username;
	var referrer = !req.session.referrer || /(\/login)/.test(req.session.referrer) || /(\/auth)/.test(req.session.referrer)  ? '/usr/profile' : req.session.referrer;
	const pu = await PublisherDB.findOne({_id: req.user._id}).then(pu=>pu).catch(err=>next(err));
	if (!pu.admin) {
		var admin;
		if (
			config.admins.split(/\,\s{0,5}/).indexOf(req.user.username) !== -1 ||
			config.admins.split(/\,\s{0,5}/).indexOf(req.user.email) !== -1
		) {
			admin = true;
		} else {
			admin = false;
		}
		// console.log(admin, config.admins, req.user)
		PublisherDB.findOneAndUpdate({_id: req.user._id}, {$set: {admin: admin}}, {new: true}, (err, user) => {
			if (err) return next(err);
			// req.user = user;
			req.session.admin = admin;
			req.session.referrer = referrer;
			return res.redirect(referrer);
		})
	} else {
		req.session.admin = pu.admin;
		req.session.referrer = referrer;
		console.log(referrer)
		return res.redirect(referrer);
	}
});

function provideRoutes(app) {
  app.use(routes);
  app.use(router);
  return;
}
module.exports = provideRoutes;
