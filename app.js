// Bring in environment secrets through dotenv
require('dotenv/config')

// Run the express app
const express = require('express')
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const router = require('./routes');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const config = require('./utils/config');
// const csrfProtection = csrf({ cookie: true });
const app = express()
app.use(cookieParser(config.secret));

//CORS middleware
var whitelist = ['bli.sh', 'soc.bli.sh', 'localhost:9999', 'http://localhost:9999']
var corsOpt = {
	origin: true,
	methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'Set-Cookie']
}
app.use(cors(corsOpt));
app.options('*', cors(corsOpt))
app.use(function(req, res, next) {
	res.cookie('site', 'cookie', {sameSite: 'None', secure: true});

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
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));

app.use('/', router);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
	res.status(404).send('Not Found');
});

app.use(function (err, req, res) {
	res.status(err.status || 500).send({
		message: err.message,
		error: err.status
	})
});

module.exports = app;