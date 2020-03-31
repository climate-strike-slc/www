require('dotenv').config();
const config = require('../config');
const moment = require('moment');
const request = require('request')
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
			req.session.token = body.access_token;
			req.session.refresh = body.refresh_token;
			req.session.expires_on = moment().add(1, 'hours').utc().format();

		}
		return next()
	})
}

function ensureAdmin(req, res, next) {
	
}
// // JWT auth
// function getAuthCodeJWT(req, res, next) {
// 	const payload = {
// 		iss: process.env.JWT_KEY,
// 		exp: ((new Date()).getTime() + 5000)
// 	};
// 	req.token = jwt.sign(payload, process.env.JWT_SECRET);
// 	// console.log(req.session.token)
// 	return next();
// }
// 
// function generateSignature(apiKey, apiSecret, meetingNumber, role) {
// 
// 	const timestamp = new Date().getTime()
// 	const msg = Buffer.from(apiKey + meetingNumber + timestamp + role).toString('base64')
// 	const hash = crypto.createHmac('sha256', apiSecret).update(msg).digest('base64')
// 	const signature = Buffer.from(`${apiKey}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64')
// 
// 	return signature
// }
// 

// OAuth
const getAuthCode = async(req, res, next) => {
	// Check if the code parameter is in the url 
	// if an authorization code is available, the user has most likely been redirected from Zoom OAuth
	// if not, the user needs to be redirected to Zoom OAuth to authorize
	const clientID = process.env.TEST_ENV || config.env !== 'production' ? config.clientIDTest : config.clientID;
	const clientSecret = process.env.TEST_ENV || config.env !== 'production' ? config.clientSecretTest : config.clientSecret;
	const redirectURL = process.env.TEST_ENV || config.env !== 'production' ? config.redirectURLTest : config.redirectURL;
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
		// if (process.env.TEST_ENV && process.env.RECORD_ENV && req.session && req.session.token) {
		// 	// console.log(req.session)
		// 	return next();
		// } else 
		if (!process.env.TEST_ENV && !process.env.RECORD_ENV) {
			req.session.referrer = referrer;
			
		}
		if (req.session && req.session.expires_on && moment().utc().format() < moment(req.session.expires_on).subtract(5, 'minutes').utc().format()) {
			return next()
		} else {
			if (req.session && req.session.token) {
				refreshAccessToken(req.session.refresh_token, err => {
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
module.exports = { getAuthCode }