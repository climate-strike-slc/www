require('dotenv').config();
const config = require('../config');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const request = require('request')

function sessionReferrer(req, res, next) {
	const referrer = req.get('Referrer');
	req.session.referrer = referrer;
	return next()
}

function sessionAdmin(req, res, next) {
	if (req.user && req.user.properties) {
		req.session.admin = req.user.properties.admin;
	} else {
		req.session.admin = false;
	}
	if (req.session.admin) {
		req.session.userSecret = config.wt;
	} else {
		req.session.userSecret = null;
	}
	return next();
}

function ensureAuthenticated(req, res, next) {
	// console.log(req.isAuthenticated())
	if (req.isAuthenticated()) {
		req.session.userId = req.user._id;
		req.session.loggedin = req.user.username;
		req.session.username = req.user.username;
		req.session.admin = req.user.properties.admin;
		return next();
	} else {
		return res.redirect('/mtg/jitsi');
	}
}

function ensureAdmin(req, res, next) {
	const admins = config.admins.split(/\,\s{0,5}/);
	// console.log(admins.indexOf(req.user.email))
	const user = req.user;
	const isAdmin = (!user || !user.properties.admin ? false : user.properties.admin)
	if (isAdmin || admins.indexOf(user.email) !== -1 || admins.indexOf(user.username) !== -1) {
		req.session.userSecret = config.userSecret;
		req.session.admin = true;
		return next();
	} else {
		return res.redirect('/mtg/jitsi')
	}
}


module.exports = { ensureAdmin, ensureAuthenticated, sessionAdmin, sessionReferrer }