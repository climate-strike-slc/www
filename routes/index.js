const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const zoom_key = process.env.clientID;
const zoom_sec = process.env.clientSecret;
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const multer = require('multer');
const rp = require('request-promise');
const upload = multer({fieldSize: 25 * 1024 * 1024});
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const csrf = require('csurf');
const csrfProtection = csrf();
// Use the request module to make HTTP requests from Node
const request = require('request')

function ensureAdmin(req, res, next) {
	
}
// OAuth
function getAuthCode(req, res, next) {
	// Check if the code parameter is in the url 
	// if an authorization code is available, the user has most likely been redirected from Zoom OAuth
	// if not, the user needs to be redirected to Zoom OAuth to authorize
	if (req.query.code) {

		// Request an access token using the auth code
		const options = {
			method: 'POST',
			url: 'https://api.zoom.us/oauth/token',
			qs: {
				grant_type: 'authorization_code',
				code: req.query.code,
				redirect_uri: process.env.redirectURL
			},
			headers: {
				Authorization: 'Basic ' + Buffer.from(process.env.clientID + ':' + process.env.clientSecret).toString('base64')
			}
		}
		
		request(options, (error, response, body) => {
			if (error) {
				return next(error)
			} else if (JSON.parse(body) && JSON.parse(body).access_token) {
				body = JSON.parse(body);
				req.session.token = body.access_token;
				req.session.refresh = body.refresh_token;
				req.session.expires_on = moment().add(1, 'hours').utc().format();

				return next();
			} else {
				return next();
			}
		});
	} else {
		const referrer = req.get('Referrer');
		req.session.referrer = referrer;
		if (req.session.expires_on && moment().utc().format() < moment(req.session.expires_on).subtract(5, 'minutes').utc().format()) {
			return next()
		} else {
			if (req.session.token) {
				refreshAccessToken(req.session.refresh_token, err => {
					if (err) {
						if (err.message === 'expired') {
							return res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL)
						}
						return next(err)
					}
					return next();
				});
			} else {
				// If no authorization code is available, redirect to Zoom OAuth to authorize
				return res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL)
			}
		}

	}
}
// JWT auth
function getAuthCodeJWT(req, res, next) {
	const payload = {
		iss: process.env.JWT_KEY,
		exp: ((new Date()).getTime() + 5000)
	};
	req.token = jwt.sign(payload, process.env.JWT_SECRET);
	console.log(req.token)
	return next();
}

function generateSignature(apiKey, apiSecret, meetingNumber, role) {

	const timestamp = new Date().getTime()
	const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
	const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
	const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')

	return signature
}

// Helper functions

function deleteMeeting(id, token, next) {
	
	const dOptions = {
		uri: `https://api.zoom.us/v2/meetings/${id}`,
		auth: {
			'bearer': token
		},
		headers: {
			'User-Agent': 'Zoom-Jwt-Request',
			'content-type': 'application/json'
		}
	};
	request(dOptions, (error, response, data) => {
		if (error) {
			return next(error)
		} else {
			// console.log(data)
			return next();
		}
	})
}

function getMe(token, next) {
	const uOptions = {
		method: 'GET',
		url: 'https://api.zoom.us/v2/users/me',
		headers: {
			Authorization: 'Bearer ' + token
		}
	}
	request(uOptions, (error, response, body) => {
		if (error) {
			return next(error)
		} else {
			body = JSON.parse(body);
			return next(null, body);
		}
	})
}

function refreshAccessToken(refresh_token, next) {
	const options = {
		method: 'POST',
		url: 'https://api.zoom.us/oauth/token',
		qs: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token,
			redirect_uri: process.env.redirectURL
		},
		headers: {
			Authorization: 'Basic ' + Buffer.from(process.env.clientID + ':' + process.env.clientSecret).toString('base64')
		}
	}
	request(options, (error, response, body) => {
		if (error) {
			return next(error)
		}
		if (response.statusCode == 400 || response.statusCode == 401) {
			return next(new Error('expired'))
		} else {
			body = JSON.parse(body);
			req.session.token = body.access_token;
			req.session.refresh = body.refresh_token;
			req.session.expires_on = moment().add(1, 'hours').utc().format();

		}
		return next()
	})
}

// function saveTokens(body) {
// 	// Parse response to JSON
// 	body = JSON.parse(body);
// 	req.session.token = body.access_token;
// 	req.session.refresh = body.refresh_token;
// 	req.session.expires_on = moment().add(1, 'hours').utc().format();
// 	return;
// }
// router.all('/api'/*, ensureAdmin*/, getAuthCode);

router.get('/', (req, res) => {
	res.render('home', {
		menu: 'home'
	});
});

router.get('/logout', (req, res, next) => {
	if (req.user || req.session) {
		req.session.destroy(function(err){
			if (err) {
				req.session = null;
			} else {
				req.session = null;
			}
		});
	}
	return res.redirect('/')
})

router.post('/signature/:meetingnumber', getAuthCodeJWT, (req, res, next) => {
	const crypto = require('crypto') // crypto comes with Node.js
	const meetingNumber = 
		// parseInt(
		req.params.meetingnumber +''
		// , 10);
	const role = (req.token ? 1 : 0);
	console.log('role')
	console.log(role)
	
	const timestamp = new Date().getTime()
  const msg = Buffer.from(process.env.JWT_KEY + meetingNumber + timestamp + role).toString('base64')
  const hash = crypto.createHmac('sha256', process.env.JWT_SECRET).update(msg).digest('base64')
  const signature = Buffer.from(`${process.env.JWT_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')
	// pass in your Zoom JWT API Key, Zoom JWT API Secret, Zoom Meeting Number, and 0 to join meeting or webinar or 1 to start meeting
	// const signature = generateSignature(process.env.JWT_KEY, process.env.JWT_SECRET, meetingNumber, role);
	// console.log(signature)
	const key = process.env.JWT_KEY;
	// const pw = process.env.WT;
	const ret = {
		apiKey: key,
		// wt: pw,
		signature: signature
	}
	console.log(ret)
	return res.json(ret)
})

router.get('/auth', getAuthCodeJWT, async (req, res, next) => {
	if (req.token) {
		// We can now use the access token to authenticate API calls
		if (!req.session.referrer || /auth/.test(req.session.referrer)) {
			// Send a request to get your user information using the /me context
			// The `/me` context restricts an API call to the user the token belongs to
			// This helps make calls to user-specific endpoints instead of storing the userID
			getMe(req.token, (err, body) => {
				if (err) {
					return next(err)
				} else {
					return res.render('profile', {
						user: body
					})
				}
			})
		} else {
			return res.redirect(req.session.referrer)
		}
	} else {
		return res.redirect('/logout')
		// something went wrong		
	}
})

router.get('/profile', getAuthCodeJWT, async (req, res, next) => {
	if (req.token) {
		getMe(req.token, (err, body) => {
			if (err) {
				return next(err)
			} else {
				return res.render('profile', {
					user: body
				})
			}
		})
	}
})

router.get('/api/createMeeting', getAuthCodeJWT, csrfProtection, function(req, res) {
	res.render('edit', {
		csrfToken: req.csrfToken(),
		title: 'Manage Meetings'
	});
});

router.post('/api/createMeeting', getAuthCodeJWT, upload.array(), parseBody, csrfProtection, async function(req, res, next) {
	console.log(req.body);
	console.log("topic:", req.body.topic);
	console.log("agenda:", '# ' +req.body.title + '  \n' + req.body.description);
	if (req.token) {
	// if (req.session && req.session.token) {
		console.log(req.token)
		const mOptions = {
			method: 'POST',
			uri: `https://api.zoom.us/v2/users/me/meetings`,
			json: {
				'topic': req.body.topic,
				'type': 2,
				'agenda': '# ' +req.body.title + '  \n' + req.body.description,
				'start-time': moment().add(5, 'minutes').utc().format(),
				'duration': 30,
				'settings': {
					'host_video': true,
					'participant_video': true,
					'join_before_host': true,
					'mute_upon_entry': true,
					'enforce_login': false,
					'meeting_authentication': false,
					'authentication_domains': '*'
				}
			},
			headers: {
				Authorization: 'Bearer ' + req.token
			}
			
		};
		request(mOptions, (error, response, body) => {
			if (error) {
				return next(error)
			}
			return res.redirect('/meetings')
		}) 
		
		// ).then(response => {
		// 	console.log(response)
		// 	return res.redirect('/meetings')
		// }).catch(err => console.log(err));
		
	} else {
		// console.log(req.session)
		// something went wrong		
	}
	 
});

router.get('/meetings', getAuthCodeJWT, function(req, res, next) {
	const options = {
		method: 'GET',
		url: `https://api.zoom.us/v2/users/me/meetings`,
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	}
	// console.log(req.session)
	request(options, (error, response, body) => {
		if (error) {
			console.log('API Response Error: ', error)
		} else {
			// console.log(body)
			body = JSON.parse(body);
			return res.render('meetings', {
				data: body
			})
		}
	})
});

router.get('/meeting/:id', getAuthCodeJWT, (req, res, next) => {
	const meetingId = req.params.id;
	const mOptions = {
		method: 'GET',
		url: `https://api.zoom.us/v2/meetings/${meetingId}`,
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	};
	request(mOptions, (error, response, data) => {
		if (error) {
			return next(error)
		} else {
			// console.log(data)
			return res.render('meeting', {
				meeting: JSON.parse(data)
			})
		}
	})
})

// router.get('/group', getAuthCodeJWT, (req, res, next) => {
// 	const options = {
// 		method: 'GET',
// 		url: `https://api.zoom.us/v2/groups`,
// 		headers: {
// 			Authorization: 'Bearer ' + req.session.token
// 		}
// 	}
// 	// console.log(req.session)
// 	request(options, async (error, response, groups) => {
// 		if (error) {
// 			console.log('API Response Error: ', error)
// 		} else {
// 			console.log(groups)
// 			groups = JSON.parse(groups);
// 			const grp = await groups.groups.map(group => {
// 				const uOptions = {
// 					method: 'GET',
// 					url: `https://api.zoom.us/v2/groups/${group.id}/members`,
// 					headers: {
// 						Authorization: 'Bearer ' + req.session.token
// 					}
// 				}
// 				request(uOptions, (err, response, members) => {
// 					members = JSON.parse(members).members;
// 					group.members = members;
// 					return group;
// 				})
// 			})
// 			return res.render('users', {
// 				data: grp
// 			})
// 		}
// 	})
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

router.get('/meetingEnd/:id', (req, res, next) => {
	const meetingId = req.params.id;
	const mOptions = {
		method: 'PUT',
		url: `https://api.zoom.us/v2/meetings/${meetingId}/status`,
		json: {
			'action': 'end'
		},
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	};
	request(mOptions, (error, response, data) => {
		if (error) {
			return next(error)
		} else {
			// console.log(data)
			return res.redirect('/meetings')
		}
	})
})

router.get('/api/deleteMeeting/:id', getAuthCodeJWT, (req, res, next) => {
	// console.log(req.params.id, req.session.token)
	deleteMeeting(req.params.id, req.token, (err) => {
		if (err) {
			return next(err)
		}
		return res.redirect('/meetings')
	})
})


module.exports = router;