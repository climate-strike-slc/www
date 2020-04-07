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
const upload = multer({fieldSize: 25 * 1024 * 1024});
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const csrf = require('csurf');
const csrfProtection = csrf({cookie:true});
const { getMe, ensureAdmin, ensureAuthenticated, sessionAdmin } = require('../utils/middleware');
const config = require('../utils/config');
// const request = require('request')

const testenv = config.testenv;
const { Content, ContentTest, Publisher, PublisherTest } = require('../models');
const PublisherDB = (!testenv ? Publisher : PublisherTest);
const ContentDB = (!testenv ? Content : ContentTest);

// Helper functions

function deleteMeeting(id, token, next) {
	ContentDB.deleteOne({_id: id}, (err, doc) => {
		if (err) {
			return next(err)
		}
		return next()
	})
}

router.all('/*', sessionAdmin)
// router.all('/api/*', getAuthCodeJWT, getMe, ensureAdmin);

router.get('/', (req, res, next) => {
	// console.log(req.cookies);
	// console.log(req.user)
	
	console.log(amIAdmin)
	res.render('home', {
		pu: req.user,
		admin: (!req.session.admin ? false : true),
		menu: 'home'
	});
});

router.get('/logout', async (req, res, next) => {
	if (req.session || req.user) {
		await req.session.destroy(err=>req.logout())
	}
	res.clearCookie('token');
	res.clearCookie('refresh');
	res.clearCookie('expires_on');
	res.clearCookie('_csrf')
	return res.redirect('/')
})

router.get('/register', csrfProtection, (req, res, next) => {
	// res.cookie('XSRF-TOKEN', req.csrfToken())
	return res.render('register', { csrfToken: req.csrfToken(), menu: 'register' } );
})

router.post('/register', upload.array(), parseBody/*, csrfProtection*/, (req, res, next) => {
	var langs = [];
	console.log(req.body)
	PublisherDB.find({}, (err, data) => {
		if (err) {
			return next(err)
		}
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
				properties: { 
					avatar: '/images/publish_logo_sq.svg', 
					admin: admin, 
					givenName: req.body.givenName, 
					zip: req.body.zip, 
					time: {
						begin: new Date(),
						end: new Date()
					}
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
					
					return res.redirect('/profile')
				})
			});
		});
	})

});

router.get('/login', csrfProtection, (req, res, next) => {
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
	req.session.userId = req.user._id;
	req.session.loggedin = req.user.username;
	var referrer = !req.session.referrer ? '/profile' : req.session.referrer;
	const pu = await PublisherDB.findOne({_id: req.user._id}).then(pu=>pu).catch(err=>next(err));
	if (!pu.properties.admin) {
		var admin;
		if (
			config.admins.split(/\,\s{0,5}/).indexOf(req.user.username) !== -1 ||
			config.admins.split(/\,\s{0,5}/).indexOf(req.user.email) !== -1
		) {
			admin = true;
		} else {
			admin = false;
		}
		console.log(admin, config.admins, req.user)
		PublisherDB.findOneAndUpdate({_id: req.user._id}, {$set: {'properties.admin': admin}}, {new: true}, (err, user) => {
			if (err) return next(err);
			// req.user = user;
			req.session.admin = admin;
			req.session.referrer = referrer;
			return res.redirect(referrer);
		})
	} else {
		req.session.admin = pu.properties.admin;
		req.session.referrer = referrer;
		return res.redirect(referrer);
	}
});

router.get('/profile', ensureAuthenticated, async (req, res, next) => {
	const user = await PublisherDB.findOne({_id: req.session.userId}).then(pu=>pu).catch(err=>next(err));
	console.log(user)
	return res.render('profile', {
		pu: user
	})
})

router.post('/checkAdmin/:userid', async (req, res, next) => {
	const userId = decodeURIComponent(req.params.userid);
	const user = await PublisherDB.findOne({_id: req.params.userid}).then(pu=>pu).catch(err=>next(err));
	let amIAdmin = false;
	if (user) {
		amIAdmin = (!user.properties.admin ? false : true)
	} else {
		amIAdmin = false;
			var amIAdmin = (!req.cookies.token ? false : true);
	}
	return res.status(200).send(amIAdmin)
})

router.get('/api/createMeeting', ensureAdmin, csrfProtection, function(req, res) {
	// if (process.env.TEST_ENV && process.env.RECORD_ENV) res.header('XSRF-TOKEN', req.csrfToken());
	// console.log(res.header['xsrf-token'])
	// res.cookie('XSRF-TOKEN', req.csrfToken(), {path: '/api/createMeeting'})
	var amIAdmin = (!req.cookies.token ? false : true);
	res.render('edit', {
		pu: req.user,
		admin: req.session.admin,
		csrfToken: req.csrfToken(),
		title: 'Manage Meetings'
	});
});

router.post('/api/createMeeting', ensureAdmin, upload.array(), parseBody, csrfProtection, async function(req, res, next) {
		var token = (!req.cookies.token ? req.token : req.cookies.token)
	const meeting = new ContentDB(req.body);
	meeting.save(err => {
		if (err) {
			return next(err)
		} else {
			
			return res.redirect('/meetings')
		}
	});
});

router.get('/meetings', async (req, res, next) => {
	// console.log(req.cookies)
	const meetings = await ContentDB.find({}).then(data=>data).catch(err=>next(err));
	return res.render('jitsi', {
		pu: req.user,
		admin: req.session.admin,
		data: meetings
	})
});

router.get('/api/editMeeting/:id', ensureAdmin, async (req, res, next) => {
	const meetingId = req.params.id;
	const doc = await ContentDB.findOne({_id: meetingId}).then(doc=>doc).catch(err=>next(err));
			var amIAdmin = (!req.cookies.token ? false : true);
	return res.render('edit', {
		pu: req.user,
		admin: req.session.admin,
		doc: doc
	})
})

router.post('/webhook', (req, res, next) => {
	console.log('webhook received')
	console.log(req.headers)
	if (req.headers && req.headers.authorization) {
		const vt = req.headers.authorization;
		const matches = vt === config.verificationToken;
		if (matches) {
			console.log(req)
			return res.status(200).send()
		} else {
			console.log('authorization mismatch. Received '+ vt +', expected '+ config.verificationToken)
			console.log(req)
			return res.status(200).send()
		}
	} else {
		return res.status(200).send()
	}
})

router.get('/deauthorize', (req, res, next) => {
	if (req.headers && req.headers.authorization) {
		const vt = req.headers.authorization;
		const matches = vt === config.verificationToken;
		if (matches) {
			const clientID = process.env.TEST_ENV || config.env !== 'production' ? config.clientIDTest : config.clientID;
			const clientSecret = process.env.TEST_ENV || config.env !== 'production' ? config.clientSecretTest : config.clientSecret;
			if (req.user) {
				// TODO JWT logout
				delete req.user;
				delete req.userName;
				// res
			}
			res.clearCookie('token');
			res.clearCookie('refresh');
			res.clearCookie('expires_on');
			const payload = vt.payload;
			const deAuth = {
				'client_id': payload.client_id,
				'user_id': payload.user_id,
				'account_id': payload.account_id,
				'compliance_completed': true,
				'deauthorization_event_received': vt
			}
			const dOptions = {
				method: 'POST',
				url: `https://api.zoom.us/v2/oauth/data/compliance`,
				json: deAuth,
				headers: {
					Authorization: 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64')
				}
			};
			request(dOptions, (error, response, data) => {
				if (error) {
					if (error.status === 429) {
						var referrer = (!req.referrer ? '/deauthorize' : req.referrer);
						return res.redirect(referrer)
					} else {
						return next(error)
					}

				} else {
					// console.log(data)
					return res.redirect('/meetings')
				}
			})
		}
// 		{
//   "payload": {
//     "user_id": "$user_id(string)",
//     "account_id": "$account_id(string)",
//     "client_id": "$client_id(string)",
//     "user_data_retention": "$user_data_retention(boolean, yes: user has allowed to store the data)",
//     "deauthorization_time": "string [datetime]",
//     "signature": "$signature(string)"
//   },
//   "event": "string"
// }
	} else {
		return next(new Error('misconfigured header parsing for req.headers.authorization. Received ' +req.headers))
	}
})
module.exports = router;