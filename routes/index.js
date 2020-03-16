const express = require('express');
const router = express.Router();
const path = require('path');
const zoom_key = process.env.clientID;
const zoom_sec = process.env.clientSecret;
// Use the request module to make HTTP requests from Node
const request = require('request')


router.get('/', function(req, res) {
	res.render('publish', {
		menu: 'home'
	});
});

router.get('/auth', async (req, res, next) => {
	// Step 1: 
	// Check if the code parameter is in the url 
	// if an authorization code is available, the user has most likely been redirected from Zoom OAuth
	// if not, the user needs to be redirected to Zoom OAuth to authorize

	if (req.query.code) {

		// Step 3: 
		// Request an access token using the auth code

		let url = 'https://zoom.us/oauth/token?grant_type=authorization_code&code=' + req.query.code + '&redirect_uri=' + process.env.redirectURL;

		request.post(url, (error, response, body) => {

			// Parse response to JSON
			body = JSON.parse(body);

			// Logs your access and refresh tokens in the browser
			console.log(`access_token: ${body.access_token}`);
			console.log(`refresh_token: ${body.refresh_token}`);

			if (body.access_token) {

				// Step 4:
				// We can now use the access token to authenticate API calls

				// Send a request to get your user information using the /me context
				// The `/me` context restricts an API call to the user the token belongs to
				// This helps make calls to user-specific endpoints instead of storing the userID

				request.get('https://api.zoom.us/v2/users/me', (error, response, body) => {
					if (error) {
						console.log('API Response Error: ', error)
					} else {
						body = JSON.parse(body);
						// Display response in console
						console.log('API call ', body);
						// Display response in browser
						var JSONResponse = '<pre><code>' + JSON.stringify(body, null, 2) + '</code></pre>'
						res.send(`
							<style>
								@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap');@import url('https://necolas.github.io/normalize.css/8.0.1/normalize.css');html {color: #232333;font-family: 'Open Sans', Helvetica, Arial, sans-serif;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;}h2 {font-weight: 700;font-size: 24px;}h4 {font-weight: 600;font-size: 14px;}.container {margin: 24px auto;padding: 16px;max-width: 720px;}.info {display: flex;align-items: center;}.info>div>span, .info>div>p {font-weight: 400;font-size: 13px;color: #747487;line-height: 16px;}.info>div>span::before {content: "👋";}.info>div>h2 {padding: 8px 0 6px;margin: 0;}.info>div>p {padding: 0;margin: 0;}.info>img {background: #747487;height: 96px;width: 96px;border-radius: 31.68px;overflow: hidden;margin: 0 20px 0 0;}.response {margin: 32px 0;display: flex;flex-wrap: wrap;align-items: center;justify-content: space-between;}.response>a {text-decoration: none;color: #2D8CFF;font-size: 14px;}.response>pre {overflow-x: scroll;background: #f6f7f9;padding: 1.2em 1.4em;border-radius: 10.56px;width: 100%;box-sizing: border-box;}
							</style>
							<div class="container">
								<div class="info">
									<img src="${body.pic_url}" alt="User photo" />
									<div>
										<span>Hello World!</span>
										<h2>${body.first_name} ${body.last_name}</h2>
										<p>${body.role_name}, ${body.company}</p>
									</div>
								</div>
								<div class="response">
									<h4>JSON Response:</h4>
									<a href="https://marketplace.zoom.us/docs/api-reference/zoom-api/users/user" target="_blank">
										API Reference
									</a>
									${JSONResponse}
								</div>
							</div>
						`);
					}
				}).auth(null, null, true, body.access_token);

			} else {
				// Handle errors, something's gone wrong!
			}

		}).auth(process.env.clientID, process.env.clientSecret);

		return;

	}

	// Step 2: 
	// If no authorization code is available, redirect to Zoom OAuth to authorize
	res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL)
})
// 
// //https://github.com/zoom/sample-app-node
// router.get('/createUser', function(req, res) {
// 	res.render('users', {title: 'User Management'});
// });
// 
// router.post('/createUser', function(req, res) {
// 
// 	var options = {
// 		qs: {api_key: zoom_key, api_secret: zoom_sec, data_type: "JSON", email: req.body.email , type: 2}
// 	};
// 
// 	// make an asynchronous request to zoom to create a User
// 	var asyncres = thenrequest('POST',"https://dev.zoom.us/v1/user/create",options).done(function (res) {
// 		console.log(res.getBody('utf8'));
// 		});
// 	res.redirect('/');
// });
// 
// router.get('/autoUser', function(req, res) {
// 	res.render('autoUsers', {title: 'User Management'});
// });
// 
// router.post('/autoUser', function(req, res) {
// 	console.log(req.body);
// 	console.log("email:", req.body.email);
// 	var options = {
// 		qs: {api_key: zoom_key, api_secret: zoom_sec, data_type: "JSON", email: req.body.email , password: req.body.pwd, type: 2}
// 	};
// 
// 	// make an asynchronous request to zoom to create a user without email verification
// 	var asyncres = thenrequest('POST',"https://dev.zoom.us/v1/user/autocreate2",options).done(function (res) {
// 		console.log(res.getBody('utf8'));
// 		});
// 	res.redirect('/');
// });
// 
// router.get('/updateUser', function(req, res) {
// 	res.render('upUsers', {title: 'User Management'});
// });
// 
// router.post('/updateUser', function(req, res) {
// 	console.log(req.body);
// 	console.log("email:", req.body.id);
// 
// 	var options = {
// 		qs: {api_key: zoom_key, api_secret: zoom_sec, data_type: "JSON", id: req.body.id , type: req.body.type}
// 	};
// 
// 	// make an asynchronous request to zoom to update a user
// 	var asyncres = thenrequest('POST',"https://dev.zoom.us/v1/user/update",options).done(function (res) {
// 		console.log(res.getBody('utf8'));
// 		});
// 	res.redirect('/');
// });
// 
// router.get('/createMeeting', function(req, res) {
// 	res.render('Meetings', {title: 'Manage Meetings'});
// });
// 
// router.post('/createMeeting', function(req, res) {
// 	console.log(req.body);
// 	console.log("id:", req.body.id);
// 
// 	console.log("topic:", req.body.topic);
// 	 var Moptions = {
// 		qs: {api_key: zoom_key, api_secret: zoom_sec, data_type: "JSON", host_id: req.body.id , topic: req.body.topic, type: 3}
// 	};
// 
// 	// make an asynchronous request to zoom to create a meeting
// 	var asyncres = thenrequest('POST',"https://dev.zoom.us/v1/meeting/create",Moptions).done(function (res) {
// 		console.log(res.getBody('utf8'));
// 		});
// 	res.redirect('/');
// });
// 
// router.get('/listMeeting', function(req, res) {
// 	res.render('listMeetings', {title: 'Manage Meetings'});
// });
// 
// router.post('/listMeeting', function(req, res) {
// 	console.log(req.body);
// 	console.log("id:", req.body.id);
// 
// 	var Moptions = {
// 		qs: {api_key: zoom_key, api_secret: zoom_sec, data_type: "JSON", host_id: req.body.id }
// 	};
// 	// make an asynchronous request to zoom to list all meetings
// 	var asyncres = thenrequest('POST',"https://dev.zoom.us/v1/meeting/list",Moptions).done(function (res) {
// 		console.log(res.getBody('utf8'));
// 		});
// 	res.redirect('/');
// });
// 
// router.get('/updateMeeting', function(req, res) {
// 	res.render('upMeetings', {title: 'Manage Meetings'});
// });
// 
// router.post('/updateMeeting', function(req, res) {
// 	console.log(req.body);
// 	console.log("id:", req.body.id);
// 
// 	console.log("topic:", req.body.topic);
// 	var Moptions = {
// 		qs: {api_key: zoom_key, api_secret: zoom_sec, data_type: "JSON", host_id: req.body.id , id: req.body.mId, type: req.body.type}
// 	};
// 	// make an asynchronous request to zoom to update a meeting
// 	var asyncres = thenrequest('POST',"https://dev.zoom.us/v1/meeting/update",Moptions).done(function (res) {
// 		console.log(res.getBody('utf8'));
// 		});
// 	res.redirect('/');
// });

module.exports = router;