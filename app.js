// Bring in environment secrets through dotenv
require('dotenv/config')

// Run the express app
const express = require('express')
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const router = require('./routes');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
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

// app.use(parseBody);

const store = new MongoDBStore(
	{
		mongooseConnection: mongoose.connection,
		uri: process.env.DB,
		collection: 'slccsSession',
		autoRemove: 'interval',     
		autoRemoveInterval: 3600
	}
);
store.on('error', function(error){
	console.log(error)
});

const sess = {
	secret: process.env.SECRET,
	name: 'nodecookie',
	resave: true,
	saveUninitialized: true,
	store: store,
	cookie: { maxAge: 180 * 60 * 1000 }
}

app.use(session(sess));

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
const uri = process.env.DB;
const promise = mongoose.connect(uri, {
	useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false
});
promise.then(function(){
	console.log('connected slccs')
})
.catch(function(err){
	console.log(err);
	console.log('MongoDB connection unsuccessful');
});

module.exports = app;