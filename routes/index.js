const express = require('express');
const router = express.Router();
const path = require('path');
const zoom_key = process.env.clientID;
const zoom_sec = process.env.clientSecret;
const bodyParser = require('body-parser');
const moment = require('moment');
const multer = require('multer');
const upload = multer({fieldSize: 25 * 1024 * 1024});
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
// Use the request module to make HTTP requests from Node
const request = require('request')

function ensureAdmin(req, res, next) {
	
}

function getClientCred(req, res, next) {
	
}

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
			// Parse response to JSON
			body = JSON.parse(body);

			// Logs your access and refresh tokens in the browser
			// console.log(`access_token: ${body.access_token}`);
			// console.log(`refresh_token: ${body.refresh_token}`);
			if (error) {
				return next(error)
			} else if (body.access_token) {
				req.session.token = body.access_token
				req.session.expires_on = moment().add(1, 'hours').utc().format()
				return next();
			} else {
				return next();
			}
		});
	} else {
		const referrer = req.get('Referrer');
		req.session.referrer = referrer;
		if (moment().utc().format() < moment(req.session.expires_on).subtract(5, 'minutes').utc().format()) {
			return next()
		} else {
			req.session.token = null;
			// If no authorization code is available, redirect to Zoom OAuth to authorize
			return res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL)
		}

	}
}

function getUser(req, res, next) {
	
}

// router.all('/api'/*, ensureAdmin*/, getAuthCode);

router.get('/', function(req, res) {
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

router.get('/auth', getAuthCode, async (req, res, next) => {
	if (req.session && req.session.token) {
		// We can now use the access token to authenticate API calls
		if (!req.session.referrer || /auth/.test(req.session.referrer)) {
			// Send a request to get your user information using the /me context
			// The `/me` context restricts an API call to the user the token belongs to
			// This helps make calls to user-specific endpoints instead of storing the userID
			const options = {
				method: 'GET',
				url: 'https://api.zoom.us/v2/users/me',
				headers: {
					Authorization: 'Bearer ' + req.session.token
				}
			}
			request(options, (error, response, body) => {
				if (error) {
					console.log('API Response Error: ', error)
				} else {
					body = JSON.parse(body);
					return res.render('profile', {
						user: body
					})
				}
			})
		} else {
			return res.redirect(req.session.referrer)
		}
	} else {
		// something went wrong		
	}
})

router.get('/api/createMeeting', getAuthCode, function(req, res) {
	res.render('edit', {title: 'Manage Meetings'});
});

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
			return next(body);
		}
	})
}

router.post('/api/createMeeting', parseBody, upload.array(), function(req, res, next) {
	// console.log(req.body);
	// console.log("topic:", req.body.topic);
	if (req.session && req.session.token) {
		getMe(req.session.token, body => {
			const mOptions = {
				method: 'POST',
				url: `https://api.zoom.us/v2/users/me/meetings`,
				json: {
					'topic': req.body.topic,
					'start-time': moment().add(1, 'hours').utc().format(),
					'duration': 30
				},
				headers: {
					Authorization: 'Bearer ' + req.session.token
				}
			};
			request(mOptions, (error, response, data) => {
				if (error) {
					return next(error)
				} else {
					console.log(data)
					return res.redirect('/meetings')
				}
			})
		})
		
	} else {
		console.log(req.session)
		// something went wrong		
	}
	 
});

router.get('/meetings', getAuthCode, function(req, res, next) {
	const options = {
		method: 'GET',
		url: `https://api.zoom.us/v2/users/me/meetings`,
		headers: {
			Authorization: 'Bearer ' + req.session.token
		}
	}
	// console.log(req.session)
	request(options, (error, response, body) => {
		if (error) {
			console.log('API Response Error: ', error)
		} else {
			console.log(body)
			body = JSON.parse(body);
			return res.render('meetings', {
				data: body
			})
		}
	})
});

module.exports = router;