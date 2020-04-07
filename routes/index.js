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
const { getAuthCode, getAuthCodeJWT, getMe, ensureAdmin, ensureAuthenticated } = require('../utils/middleware');
const config = require('../utils/config');
// Use the request module to make HTTP requests from Node
const request = require('request')

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
	// const dOptions = {
	// 	method: 'DELETE',
	// 	url: `https://api.zoom.us/v2/meetings/${id}`,
	// 	headers: {
	// 		Authorization: 'Bearer ' + token
	// 	}
	// };
	// request(dOptions, (error, response, data) => {
	// 	if (error) {
	// 		if (error.status === 429) {
	// 			var referrer = '/meetings';
	// 			return res.redirect(referrer)
	// 		} else {
	// 			return next(error)
	// 		}
	// 
	// 	} else {
	// 		return next();
	// 	}
	// })
}

// router.all('/api/*', getAuthCodeJWT, getMe, ensureAdmin);

// function saveTokens(body) {
// 	// Parse response to JSON
// 	body = JSON.parse(body);
// 	req.token = body.access_token;
// 	req.refresh = body.refresh_token;
// 	req.expires_on = moment().add(1, 'hours').utc().format();
// 	return;
// }
// router.all('/api'/*, ensureAdmin*/, getAuthCodeJWT);

router.get('/', (req, res, next) => {
	// console.log(req.cookies);
	var amIAdmin = (!req.cookies.token ? false : true);
	console.log('Am I admin?')
	console.log(amIAdmin)
	res.render('home', {
		admin: (!req.amIAdmin ? amIAdmin : req.amIAdmin),
		menu: 'home'
	});
});

router.get('/logout', async (req, res, next) => {
	if (req.session || req.user) {
		// TODO JWT logout
		await req.session.destroy(err=>req.logout())
	}
	res.clearCookie('token');
	res.clearCookie('refresh');
	res.clearCookie('expires_on');
	res.clearCookie('_csrf')
	// delete req.cookies.token;
	// delete req.cookies.refresh;
	// res.cookie('token', null);
	// res.cookie('refresh', null);
	return res.redirect('/')
})

// router.post('/signature/:meetingnumber', async (req, res, next) => {
// 	const meetingNumber = parseInt(req.params.meetingnumber);
// 	const role = 0;
// 	const timestamp = new Date().getTime()
//   const msg = Buffer.from(process.env.JWT_KEY + meetingNumber + timestamp + role).toString('base64')
//   const hash = await crypto.createHmac('sha256', process.env.JWT_SECRET).update(msg).digest('base64')
//   const signature = Buffer.from(`${process.env.JWT_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')
// 	const key = process.env.JWT_KEY;
// 	const ret = {
// 		apiKey: key,
// 		wt: process.env.WT,
// 		signature: signature
// 	}
// 	return res.json(ret)
// })
// 
			var amIAdmin = (!req.cookies.token ? false : true);
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
			config.admins.split(',').indexOf(req.body.username) !== -1 ||
			config.admins.split(',').indexOf(req.body.email) !== -1
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
					/*place: req.body.place, placetype: req.body.placetype, time: { begin: req.body.datebegin, end: req.body.dateend }*/ 
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
					
					return res.redirect('/Profile')
				})
			});
		});
	})

});

router.get('/login', csrfProtection, (req, res, next) => {
	var referrer = req.get('Referrer');
	req.session.referrer = referrer;
	return res.render('login', { 
		user: req.user,
		csrfToken: req.csrfToken(),
		menu: 'login'
	});
});

router.post('/login', upload.array(), parseBody, csrfProtection, passport.authenticate('local', {
	failureRedirect: '/login'
}), (req, res, next) => {
	req.session.userId = req.user._id;
	req.session.loggedin = req.user.username;
	var referrer = !req.session.referrer ? '/profile' : req.session.referrer
	return res.redirect(referrer);		
});

// router.get('/auth', getAuthCode, getAuthCodeJWT, async (req, res, next) => {
// 	if (req.user) {
// 		const body = req.user;
// 		if (!req.referrer || /auth/.test(req.referrer)) {
// 
// 			return res.render('profile', {
// 				admin: (!req.amIAdmin ? false : true),
// 				user: body
// 			})
// 		} else {
// 			return res.redirect(req.referrer)
// 		}
// 	} else {
// 		return res.redirect('/logout')
// 		// something went wrong		
// 	}
// })

router.get('/profile', ensureAuthenticated, async (req, res, next) => {
	const user = await PublisherDB.findOne({_id: req.session.userId}).then(pu=>pu).catch(err=>next(err));
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
	// if (!req.token) {
	// 	return next()
	// } else {
	// 	const uOptions = {
	// 		method: 'GET',
	// 		url: `https://api.zoom.us/v2/users/${userId}`,
	// 		headers: {
	// 			Authorization: 'Bearer ' + req.token
	// 		}
	// 	}
	// 	request(uOptions, (error, response, body) => {
	// 		if (error) {
	// 			console.log(error)
	// 			if (error.status === 429) {
	// 				var referrer = '/meetings';
	// 				return res.redirect(referrer)
	// 			} else {
	// 				return next(error)
	// 			}
	// 
	// 		} else {
	// 			body = JSON.parse(body);
	// 			// console.log(body)
	// 			req.user = body;
	// 			// const admins = config.admins.split(',');
	// 			if (req.user.role_name === 'Owner' || req.user.role_name === 'Admin') {
	// 				return res.status(200).send(true)
	// 			} else {
	// 				return res.status(200).send(false)
	// 			}
	// 			// return next();
	// 		}
	// 	})
	// }
	
})

router.get('/api/createMeeting', ensureAdmin, csrfProtection, function(req, res) {
	// console.log(req)
	// console.log(req.csrfToken())
	// if (process.env.TEST_ENV && process.env.RECORD_ENV) res.header('XSRF-TOKEN', req.csrfToken());
	// console.log(res.header['xsrf-token'])
	// res.cookie('XSRF-TOKEN', req.csrfToken(), {path: '/api/createMeeting'})
	var amIAdmin = (!req.cookies.token ? false : true);
	res.render('edit', {
		admin: req.session.admin,
		csrfToken: req.csrfToken(),
		title: 'Manage Meetings'
	});
});

router.post('/api/createMeeting', ensureAdmin, upload.array(), parseBody, csrfProtection, async function(req, res, next) {
	// console.log(req.body);
	// console.log("topic:", req.body.topic);
	// console.log("agenda:", '# ' +req.body.title + '  \n' + req.body.description);
		var token = (!req.cookies.token ? req.token : req.cookies.token)
	
	const meeting = new ContentDB(req.body);
	meeting.save(err => {
		if (err) {
			return next(err)
		} else {
			
			return res.redirect('/meetings')
		}
	});
	
	// if (req.token && req.cookies.token) {
	// // if (req && req.token) {
	// 	// console.log(req.token)
	// 	// console.log(req.body.start_time, moment(req.body.start_time).utc().format())
	// 	const mOptions = {
	// 		method: 'POST',
	// 		uri: `https://api.zoom.us/v2/users/${config.hostID}/meetings`,
	// 		json: {
	// 			'topic': req.body.topic,
	// 			'type': 2,
	// 			'agenda': '# ' +req.body.title + '  \n' + req.body.description,
	// 			'start_time': moment(req.body.start_time).utc().format(),//moment().add(5, 'minutes').utc().format(),
	// 			'duration': 30,
	// 			'settings': {
	// 				'host_video': true,
	// 				'participant_video': true,
	// 				'use_pmi': false,
	// 				'join_before_host': true,
	// 				'mute_upon_entry': true,
	// 				'enforce_login': false,
	// 				'enforce_login_domains': '*',
	// 				'meeting_authentication': false,
	// 				// Have tried with and without:
	// 				// 'authentication_domains': '*'
	// 			}
	// 		},
	// 		headers: {
	// 			Authorization: 'Bearer ' + req.cookies.token
	// 		}
	// 
	// 	};
	// 	request(mOptions, (error, response, body) => {
	// 		if (error) {
	// 			if (error.status === 429) {
	// 				var referrer = (!req.referrer ? '/api/createMeeting' : req.referrer);
	// 				return res.redirect(referrer)
	// 			} else {
	// 				return next(error)
	// 			}
	// 		}
	// 		const meeting = (!process.env.TEST_ENV ? new Meeting(body) : new MeetingTest(body));
	// 		meeting.save(err => {
	// 			if (err) {
	// 				return next(err)
	// 			} else {
	// 
	// 				return res.redirect('/meetings')
	// 			}
	// 		});
	// 	}) 
	// } else {
	// 	// console.log(req)
	// 	// something went wrong		
	// }
	 
});

router.get('/meetings', async (req, res, next) => {
	// console.log(req.cookies)
	const meetings = await ContentDB.find({}).then(data=>data).catch(err=>next(err));
			var amIAdmin = (!req.cookies.token ? false : true);
	return res.render('meetings', {
		admin: req.session.admin,
		// userName: b64Name,
		data: meetings
	})

	// const options = {
	// 	method: 'GET',
	// 	url: `https://api.zoom.us/v2/users/${config.hostID}/meetings`,
	// 	headers: {
	// 		Authorization: 'Bearer ' + req.token
	// 	}
	// }
	// // console.log(req)
	// request(options, (error, response, body) => {
	// 	if (error) {
	// 		if (error.status === 429) {
	// 			var referrer = (!req.referrer ? '/meetings' : req.referrer);
	// 			return res.redirect(referrer)
	// 		} else {
	// 			return next(error)
	// 		}
	// 
	// 	} else {
	// 		body = JSON.parse(body);
	// 		// console.log(body)
	// 		const b64Name = (!req.userName ? null : Buffer.from(req.userName).toString('base64'))
	// 		return res.render('meetings', {
	// 			admin: (!req.amIAdmin ? false : true),
	// 			userName: b64Name,
	// 			data: body.meetings
	// 		})
	// 
	// 	}
	// })
});

router.get('/api/editMeeting/:id', ensureAdmin, async (req, res, next) => {
	const meetingId = req.params.id;
	const doc = await ContentDB.findOne({_id: meetingId}).then(doc=>doc).catch(err=>next(err));
			var amIAdmin = (!req.cookies.token ? false : true);
	return res.render('edit', {
		admin: req.session.admin,
		// userName: b64Name,
		doc: doc
	})

	// const mOptions = {
	// 	method: 'GET',
	// 	url: `https://api.zoom.us/v2/meetings/${meetingId}`,
	// 	headers: {
	// 		Authorization: 'Bearer ' + req.token
	// 	}
	// };
	// request(mOptions, (error, response, data) => {
	// 	if (error) {
	// 		if (error.status === 429) {
	// 			var referrer = (!req.referrer ? '/meetings' : req.referrer);
	// 			return res.redirect(referrer)
	// 		} else {
	// 			return next(error)
	// 		}
	// 	} else {
	// 		// console.log(data)
	// 		const b64Name = (!req.userName ? null : Buffer.from(req.userName).toString('base64'))
	// 		return res.render('edit', {
	// 			admin: (!req.amIAdmin ? false : true),
	// 			userName: b64Name,
	// 			doc: JSON.parse(data)
	// 		})
	// 	}
	// })
})


// router.get('/meeting/:id', getAuthCodeJWT, (req, res, next) => {
// 	const meetingId = req.params.id;
// 	const mOptions = {
// 		method: 'GET',
// 		url: `https://api.zoom.us/v2/meetings/${meetingId}`,
// 		headers: {
// 			Authorization: 'Bearer ' + req.token
// 		}
// 	};
// 	request(mOptions, (error, response, data) => {
// 		if (error) {
// 			if (error.status === 429) {
// 				var referrer = (!req.referrer ? '/meetings' : req.referrer);
// 				return res.redirect(referrer)
// 			} else {
// 				return next(error)
// 			}
// 		} else {
// 			// console.log(data)
// 			return res.render('meeting', {
// 				meeting: JSON.parse(data)
// 			})
// 		}
// 	})
// })
// 
// router.get('/api/groups', getAuthCodeJWT, ensureAdmin, csrfProtection, (req, res, next) => {
// 	const options = {
// 		method: 'GET',
// 		url: `https://api.zoom.us/v2/groups`,
// 		headers: {
// 			Authorization: 'Bearer ' + req.token
// 		}
// 	}
// 	request(options, async (error, response, groups) => {
// 		if (error) {
// 			console.log('API Response Error: ', error)
// 		} else {
// 			console.log(groups)
// 			groups = JSON.parse(groups);
// 			const grp = await groups.groups.map(group => {
// 				let g = group;
// 				const uOptions = {
// 					method: 'GET',
// 					url: `https://api.zoom.us/v2/groups/${group.id}/members`,
// 					headers: {
// 						Authorization: 'Bearer ' + req.token
// 					}
// 				}
// 				request(uOptions, (err, response, members) => {
// 					members = JSON.parse(members).members;
// 					g.members = members;
// 					// console.log(members)
// 				})
// 				if (g.members) return g;
// 
// 			})
// 			console.log(grp)
// 			return res.render('users', {
// 				admin: (!req.amIAdmin ? false : true),
// 				users: grp
// 			})
// 		}
// 	})
// })
// 
// router.post('/api/addGroup', getAuthCodeJWT, csrfProtection, async (req, res, next) => {
// 
// })

// router.post('/api/checkgroup/:id', getAuthCodeJWT, ensureAdmin, (req, res, next) => {
// 	const uOptions = {
// 		method: 'GET',
// 		url: `https://api.zoom.us/v2/groups/${req.params.id}/members`,
// 		headers: {
// 			Authorization: 'Bearer ' + req.token
// 		}
// 	}
// 	request(uOptions, (err, response, members) => {
// 		if (err) {
// 			return next(err)
// 		}
// 		const group = JSON.parse(members).members;
// 		return res.status(200).send(group)
// 	})
// })
// 
// //add group
// router.post('/api/createGroup', getAuthCodeJWT, ensureAdmin, upload.array(), parseBody, csrfProtection, async (req, res, next) => {
// 	if (req && req.token) {
// 		const mOptions = {
// 			method: 'POST',
// 			uri: `https://api.zoom.us/v2/groups`,
// 			json: {
// 				'name': req.body.topic
// 			},
// 			headers: {
// 				Authorization: 'Bearer ' + req.token
// 			}
// 
// 		};
// 		request(mOptions, (error, response, body) => {
// 			if (error) {
// 				if (error.status === 429) {
// 					var referrer = (!req.referrer ? '/api/groups' : req.referrer);
// 					return res.redirect(referrer)
// 				} else {
// 					return next(error)
// 				}
// 
// 			}
// 			return res.redirect('/meetings')
// 		}) 
// 	} else {
// 		// console.log(req)
// 		// something went wrong		
// 	}
// 
// })

// add group members
// router.post('/group/:id', getAuthCodeJWT, (req, res, next) => {
// 	{
//   "members": [
//     {
//       "id": "36565387",
//       "email": "memberemail@somecompany.com"
//     }
//   ]
// }
// })

// router.get('/api/meetingEnd/:id', getAuthCodeJWT, ensureAdmin, (req, res, next) => {
// 	const meetingId = req.params.id;
// 	const mOptions = {
// 		method: 'PUT',
// 		url: `https://api.zoom.us/v2/meetings/${meetingId}/status`,
// 		json: {
// 			'action': 'end'
// 		},
// 		headers: {
// 			Authorization: 'Bearer ' + req.token
// 		}
// 	};
// 	request(mOptions, (error, response, data) => {
// 		if (error) {
// 			if (error.status === 429) {
// 				var referrer = (!req.referrer ? '/meetings' : req.referrer);
// 				return res.redirect(referrer)
// 			} else {
// 				return next(error)
// 			}
// 
// 		} else {
// 			// console.log(data)
// 			return res.redirect('/meetings')
// 		}
// 	})
// })
// 
// router.get('/api/deleteMeeting/:id', getAuthCodeJWT, ensureAdmin, (req, res, next) => {
// 	// console.log(req.params.id, req.token)
// 	deleteMeeting(req.params.id, req.token, (err) => {
// 		if (err) {
// 			return next(err)
// 		}
// 		return res.redirect('/meetings')
// 	})
// })

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