// Bring in environment secrets through dotenv
require('dotenv/config')

// Run the express app
const express = require('express')
const path = require('path');
const bodyParser = require('body-parser');
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const router = require('./routes');
const app = express()

app.use(function(req, res, next) {
	app.disable('x-powered-by');
	app.disable('Strict-Transport-Security');
	res.set({
		'Access-Control-Allow-Origin' : '*',
		'Access-Control-Allow-Methods' : 'GET, POST, HEAD, OPTIONS',
		'Access-Control-Allow-Headers' : 'Cache-Control, Origin, Content-Type, Accept, Set-Cookie',
		'Access-Control-Allow-Credentials' : true,
	});
	next();
})

app.set('views', './views');
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.use(parseBody);
app.use('/', router);


module.exports = app;