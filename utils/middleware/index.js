require('dotenv').config();
const config = require('../config');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const request = require('request')

function ensureAdmin(req, res, next) {
	const admins = config.admins.split(',');
	console.log(admins.indexOf(req.user.email))
	if (admins.indexOf(req.user.email) !== -1) {
		return next();
	} else {
		return res.redirect('/');
	}
}

function getMe(req, res, next) {
	if (!req.token) {
		return next()
	} else {
		const uOptions = {
			method: 'GET',
			url: 'https://api.zoom.us/v2/users/me',
			headers: {
				Authorization: 'Bearer ' + req.token
			}
		}
		request(uOptions, (error, response, body) => {
			if (error) {
				console.log(error)
				if (error.status === 429) {
					var referrer = '/meetings';
					return res.redirect(referrer)
				} else {
					return next(error)
				}

			} else {
				body = JSON.parse(body);
				// console.log(body)
				req.user = body;
				const admins = config.admins.split(',');
				if (admins.indexOf(req.user.email) !== -1) {
					req.amIAdmin = true;
				} else {
					req.amIAdmin = false;
				}
				return next();
			}
		})
	}
}

function refreshAccessToken(refresh_token, next) {
	const clientID = process.env.TEST_ENV || config.env !== 'production' ? config.clientIDTest : config.clientID;
	const clientSecret = process.env.TEST_ENV || config.env !== 'production' ? config.clientSecretTest : config.clientSecret;
	const redirectURL = process.env.TEST_ENV || config.env !== 'production' ? config.redirectURLTest : config.redirectURL;
	const options = {
		method: 'POST',
		url: 'https://api.zoom.us/oauth/token',
		qs: {
			grant_type: 'refresh_token',
			refresh_token: refresh_token,
			redirect_uri: redirectURL
		},
		headers: {
			Authorization: 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64')
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
			// if (req.cookies) {
			const expires = new Date(Date.now() + 8 * 3600000); //8hrs
			res.cookie('token', body.access_token, { expires: expires/*, signed: true*/ })
			res.cookie('refresh', body.refresh_token, { expires: expires/*, signed: true*/ });
			res.cookie('expires_on', expires, { expires: expires/*, signed: true*/ });
			req.userName = body.first_name + ' ' + body.last_name
			req.user = body;
			const admins = config.admins.split(',');
			if (admins.indexOf(req.user.email) !== -1) {
				req.amIAdmin = true;
			} else {
				req.amIAdmin = false;
			}

			// }
		}
		return next()
	})
}

// JWT auth
function getAuthCodeJWT(req, res, next) {
	const payload = {
		iss: config.jwtKey,
		exp: ((new Date()).getTime() + 5000)
	};
	req.token = jwt.sign(payload, config.jwtSecret);
	const referrer = req.get('Referrer');
	req.referrer = referrer;
	const uOptions = {
		method: 'GET',
		url: 'https://api.zoom.us/v2/users/me',
		headers: {
			Authorization: 'Bearer ' + req.token
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
			req.userName = body.first_name + ' ' + body.last_name
			req.user = body;
			const admins = config.admins.split(',');
			if (admins.indexOf(req.user.email) !== -1) {
				req.amIAdmin = true;
			} else {
				req.amIAdmin = false;
			}
			return next();
		}
	})
	
	// console.log(req.session.token)
}

function generateSignature(apiKey, apiSecret, meetingNumber, role) {

	const timestamp = new Date().getTime()
	const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
	const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
	const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')

	return signature
}


// OAuth
const getAuthCode = async(req, res, next) => {
	const clientID = process.env.TEST_ENV || config.env !== 'production' ? config.clientIDTest : config.clientID;
	const clientSecret = process.env.TEST_ENV || config.env !== 'production' ? config.clientSecretTest : config.clientSecret;
	const redirectURL = process.env.TEST_ENV || config.env !== 'production' ? config.redirectURLTest : config.redirectURL;
	// Check if the code parameter is in the url 
	// if an authorization code is available, the user has most likely been redirected from Zoom OAuth
	// if not, the user needs to be redirected to Zoom OAuth to authorize
	if (req.query && req.query.code) {

		// Request an access token using the auth code
		const options = {
			method: 'POST',
			url: 'https://api.zoom.us/oauth/token',
			qs: {
				grant_type: 'authorization_code',
				code: req.query.code,
				redirect_uri: redirectURL
			},
			headers: {
				Authorization: 'Basic ' + Buffer.from(clientID + ':' + clientSecret).toString('base64')
			}
		}
		
		request(options, (error, response, body) => {
			if (error) {
				return next(error)
			} else if (JSON.parse(body) && JSON.parse(body).access_token) {
				body = JSON.parse(body);
				// if (req.session) {
				// 	// req.oAuthToken = body.access_token;
				// 	// req.oAuthRefreshToken = body.refresh_token;
				// 
				// }
				const expires = new Date(Date.now() + 8 * 3600000); //8hrs
				res.cookie('token', body.access_token, { expires: expires/*, signed: true*/ })
				res.cookie('refresh', body.refresh_token, { expires: expires/*, signed: true*/ });
				res.cookie('expires_on', expires, { expires: expires/*, signed: true*/ });
				req.userName = body.first_name + ' ' + body.last_name
				req.user = body;
				const admins = config.admins.split(',');
				if (admins.indexOf(req.user.email) !== -1) {
					req.amIAdmin = true;
				} else {
					req.amIAdmin = false;
				}
				return next();
			} else {
				return next();
			}
		});
	} else {

		const referrer = req.get('Referrer');
		// if (process.env.TEST_ENV && process.env.RECORD_ENV && req.session && req.session.token) {
		// 	// console.log(req.session)
		// 	return next();
		// } else 
		if (!process.env.TEST_ENV && !process.env.RECORD_ENV) {
			req.referrer = referrer;
			
		}
		if (req.cookies && req.cookies.expires_on && new Date(Date.now()) < /*moment(req.cookies.expires_on).subtract(5, 'minutes').utc().format()*/
			new Date(req.cookies.expires_on - 0.5 * 3600000)
			) {
			return next()
		} else {
			if (req.cookies && req.cookies.refresh) {
				refreshAccessToken(req.cookies.refresh, err => {
					if (err) {
						if (err.message === 'expired') {
							return res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + clientID + '&redirect_uri=' + redirectURL)
						}
						return next(err)
					}
					return next();
				});
			} else {
				// If no authorization code is available, redirect to Zoom OAuth to authorize
				return res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + clientID + '&redirect_uri=' + redirectURL)
			}
		}

	}
}
module.exports = { getAuthCode, getAuthCodeJWT, getMe, ensureAdmin }