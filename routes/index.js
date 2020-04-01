require('dotenv').config()
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const path = require('path');
const bodyParser = require('body-parser');
const moment = require('moment');
const multer = require('multer');
const rp = require('request-promise');
const upload = multer({fieldSize: 25 * 1024 * 1024});
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const csrf = require('csurf');
const csrfProtection = csrf();
const { getAuthCodeJWT } = require('../utils/middleware');
const config = require('../utils/config');
// Use the request module to make HTTP requests from Node
const request = require('request')

// Helper functions

function deleteMeeting(id, token, next) {
	
	const dOptions = {
		method: 'DELETE',
		url: `https://api.zoom.us/v2/meetings/${id}`,
		headers: {
			Authorization: 'Bearer ' + token
		}
	};
	request(dOptions, (error, response, data) => {
		if (error) {
			if (error.status === 429) {
				var referrer = '/meetings';
				return res.redirect(referrer)
			} else {
				return next(error)
			}

		} else {
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
			if (error.status === 429) {
				var referrer = '/meetings';
				return res.redirect(referrer)
			} else {
				return next(error)
			}

		} else {
			body = JSON.parse(body);
			// console.log(body)
			return next(null, body);
		}
	})
}


// function saveTokens(body) {
// 	// Parse response to JSON
// 	body = JSON.parse(body);
// 	req.token = body.access_token;
// 	req.refresh = body.refresh_token;
// 	req.expires_on = moment().add(1, 'hours').utc().format();
// 	return;
// }
// router.all('/api'/*, ensureAdmin*/, getAuthCodeJWT);

router.get('/', (req, res) => {
	res.render('home', {
		menu: 'home'
	});
});

router.get('/logout', (req, res, next) => {
	if (req.user || req) {
		// TODO JWT logout
	}
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
router.get('/auth', getAuthCodeJWT, async (req, res, next) => {
	if (req.token) {
		// We can now use the access token to authenticate API calls
		getMe(req.token, (err, body) => {
			if (err) {
				return next(err)
			} else {
				req.userName = body.first_name + ' ' + body.last_name
				req.admin = body.role_name === 'Admin' || body.role_name === 'Owner';
				if (!req.referrer || /auth/.test(req.referrer)) {
					// Send a request to get your user information using the /me context
					// The `/me` context restricts an API call to the user the token belongs to
					// This helps make calls to user-specific endpoints instead of storing the userID
					return res.render('profile', {
						user: body
					})
				} else {
					return res.redirect(req.referrer)
				}
			}
		})
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

router.get('/webinars', getAuthCodeJWT, (req, res, next) => {
	const userId = encodeURIComponent('tbushman@pu.bli.sh')
	const mOptions = {
		method: 'GET',
		url: `https://api.zoom.us/v2/users/${userId}/webinars`,
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	};
	request(mOptions, (error, response, data) => {
		if (error) {
			if (error.status === 429) {
				var referrer = (!req.referrer ? '/meetings' : req.referrer);
				return res.redirect(referrer)
			} else {
				return next(error)
			}
		} else {
			const body = JSON.parse(data)
			// console.log(body)
			const b64Name = (!req.userName ? null : Buffer.from(req.userName).toString('base64'))
			return res.render('meetings', {
				admin: (!req.admin ? false : true),
				userName: b64Name,
				data: body
			})
		}
	})

})

router.get('/api/createMeeting', getAuthCodeJWT, csrfProtection, function(req, res) {
	// console.log(req)
	// console.log(req.csrfToken())
	if (process.env.TEST_ENV && process.env.RECORD_ENV) res.header('XSRF-TOKEN', req.csrfToken());
	// console.log(res.header['xsrf-token'])
	res.render('edit', {
		csrfToken: req.csrfToken(),
		title: 'Manage Meetings'
	});
});

router.post('/api/createMeeting', getAuthCodeJWT, upload.array(), parseBody, csrfProtection, async function(req, res, next) {
	// console.log(req.body);
	// console.log("topic:", req.body.topic);
	// console.log("agenda:", '# ' +req.body.title + '  \n' + req.body.description);
	if (req && req.token) {
	// if (req && req.token) {
		// console.log(req.token)
		// console.log(req.body.start_time, moment(req.body.start_time).utc().format())
		const mOptions = {
			method: 'POST',
			uri: `https://api.zoom.us/v2/users/${config.hostID}/meetings`,
			json: {
				'topic': req.body.topic,
				'type': 2,
				'agenda': '# ' +req.body.title + '  \n' + req.body.description,
				'start_time': moment(req.body.start_time).utc().format(),//moment().add(5, 'minutes').utc().format(),
				'duration': 30,
				'settings': {
					'host_video': true,
					'participant_video': true,
					'use_pmi': false,
					'join_before_host': true,
					'mute_upon_entry': true,
					'enforce_login': false,
					'enforce_login_domains': '*',
					'meeting_authentication': false,
					// Have tried with and without:
					// 'authentication_domains': '*'
				}
			},
			headers: {
				Authorization: 'Bearer ' + req.token
			}
			
		};
		request(mOptions, (error, response, body) => {
			if (error) {
				if (error.status === 429) {
					var referrer = (!req.referrer ? '/api/createMeeting' : req.referrer);
					return res.redirect(referrer)
				} else {
					return next(error)
				}
			}
			const meeting = (!process.env.TEST_ENV ? new Meeting(body) : new MeetingTest(body));
			meeting.save(err => {
				if (err) {
					return next(err)
				} else {
					
					return res.redirect('/meetings')
				}
			});
		}) 
	} else {
		// console.log(req)
		// something went wrong		
	}
	 
});

router.get('/meetings', getAuthCodeJWT, function(req, res, next) {
	const options = {
		method: 'GET',
		url: `https://api.zoom.us/v2/users/${config.hostID}/meetings`,
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	}
	// console.log(req)
	request(options, (error, response, body) => {
		if (error) {
				if (error.status === 429) {
					var referrer = (!req.referrer ? '/meetings' : req.referrer);
					return res.redirect(referrer)
				} else {
					return next(error)
				}

		} else {
			body = JSON.parse(body);
			// console.log(body)
			const b64Name = (!req.userName ? null : Buffer.from(req.userName).toString('base64'))
			return res.render('meetings', {
				admin: (!req.admin ? false : true),
				userName: b64Name,
				data: body.meetings
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
			if (error.status === 429) {
				var referrer = (!req.referrer ? '/meetings' : req.referrer);
				return res.redirect(referrer)
			} else {
				return next(error)
			}
		} else {
			// console.log(data)
			return res.render('meeting', {
				meeting: JSON.parse(data)
			})
		}
	})
})

router.get('/api/groups', getAuthCodeJWT, csrfProtection, (req, res, next) => {
	const options = {
		method: 'GET',
		url: `https://api.zoom.us/v2/groups`,
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	}
	request(options, async (error, response, groups) => {
		if (error) {
			console.log('API Response Error: ', error)
		} else {
			console.log(groups)
			groups = JSON.parse(groups);
			const grp = await groups.groups.map(group => {
				let g = group;
				const uOptions = {
					method: 'GET',
					url: `https://api.zoom.us/v2/groups/${group.id}/members`,
					headers: {
						Authorization: 'Bearer ' + req.token
					}
				}
				request(uOptions, (err, response, members) => {
					members = JSON.parse(members).members;
					g.members = members;
					// console.log(members)
				})
				if (g.members) return g;
	
			})
			console.log(grp)
			return res.render('users', {
				users: grp
			})
		}
	})
})
// 
// router.post('/api/addGroup', getAuthCodeJWT, csrfProtection, async (req, res, next) => {
// 
// })

router.post('/api/checkgroup/:id', (req, res, next) => {
	const uOptions = {
		method: 'GET',
		url: `https://api.zoom.us/v2/groups/${req.params.id}/members`,
		headers: {
			Authorization: 'Bearer ' + req.token
		}
	}
	request(uOptions, (err, response, members) => {
		if (err) {
			return next(err)
		}
		const group = JSON.parse(members).members;
		return res.status(200).send(group)
	})
})

//add group
router.post('/api/createGroup', getAuthCodeJWT, upload.array(), parseBody, csrfProtection, async (req, res, next) => {
	if (req && req.token) {
		const mOptions = {
			method: 'POST',
			uri: `https://api.zoom.us/v2/groups`,
			json: {
				'name': req.body.topic
			},
			headers: {
				Authorization: 'Bearer ' + req.token
			}
			
		};
		request(mOptions, (error, response, body) => {
			if (error) {
				if (error.status === 429) {
					var referrer = (!req.referrer ? '/api/groups' : req.referrer);
					return res.redirect(referrer)
				} else {
					return next(error)
				}

			}
			return res.redirect('/meetings')
		}) 
	} else {
		// console.log(req)
		// something went wrong		
	}

})

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

router.get('/api/meetingEnd/:id', getAuthCodeJWT, (req, res, next) => {
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
			if (error.status === 429) {
				var referrer = (!req.referrer ? '/meetings' : req.referrer);
				return res.redirect(referrer)
			} else {
				return next(error)
			}

		} else {
			// console.log(data)
			return res.redirect('/meetings')
		}
	})
})

router.get('/api/deleteMeeting/:id', getAuthCodeJWT, (req, res, next) => {
	// console.log(req.params.id, req.token)
	deleteMeeting(req.params.id, req.token, (err) => {
		if (err) {
			return next(err)
		}
		return res.redirect('/meetings')
	})
})


module.exports = router;