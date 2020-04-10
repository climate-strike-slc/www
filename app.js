const express = require('express')
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const favicon = require('serve-favicon');
const parseForm = bodyParser.urlencoded({ extended: false });
const parseJSONBody = bodyParser.json();
const parseBody = [parseJSONBody, parseForm];
const { router, api, usr, mtg } = require('./routes');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const config = require('./utils/config');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport')
const MongoDBStore = require('connect-mongodb-session')(session);
const testenv = config.testenv;
const { Content, ContentTest, Publisher, PublisherTest } = require('./models');
const PublisherDB = (!testenv ? Publisher : PublisherTest);
const ContentDB = (!testenv ? Content : ContentTest);
const LocalStrategy = require('passport-local').Strategy;
const provideRoutes = require('./routes');

const app = express()

//CORS middleware
var whitelist = ['bli.sh', 'meet.bli.sh', 'localhost:9999', 'http://localhost:9999']
var corsOpt = {
	origin: true,
	methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'Set-Cookie']
}
app.use(cors(corsOpt));
app.options('*', cors(corsOpt))

const store = new MongoDBStore(
	{
		mongooseConnection: mongoose.connection,
		uri: config.db,
		collection: 'slccsSession',
		autoRemove: 'interval',     
		autoRemoveInterval: 3600
	}
);
store.on('error', function(error){
	console.log(error)
});

passport.use(new LocalStrategy(PublisherDB.authenticate()));
passport.serializeUser(function(user, done) {
  done(null, user._id);
});
passport.deserializeUser(function(id, done) {
	PublisherDB.findOne({_id: id}, function(err, user){

		if(!err) {
			done(null, user);
		} else {
			done(err, null);
		}
	});
});

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
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));


const sess = {
	secret: config.secret,
	name: 'nodecookie',
	resave: true,
	saveUninitialized: true,
	store: store,
	cookie: { maxAge: 180 * 60 * 1000 }
}
app.use(cookieParser(config.secret));
app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());

if (app.get('env') === 'production') {
	app.set('trust proxy', 1)
}

app.use((req, res, next) => {
	res.locals.session = req.session;
	return next();
})

provideRoutes(app);

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
const uri = config.db;
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