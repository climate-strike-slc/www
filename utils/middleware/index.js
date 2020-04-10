require('dotenv').config();
const config = require('../config');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const request = require('request');
const url = require('url')

function sessionReferrer(req, res, next) {
	// console.log('sessionReferrer')
	const referrer = req.get('Referrer');
	req.session.referrer = (!referrer ? '/mtg/jitsi' : url.parse(referrer).pathname);
	// console.log(req.session.referrer)
	return next()
}

function sessionAdmin(req, res, next) {
	// console.log('sessionAdmin')
	if (req.user) {
		req.session.userName = config.userName;
		req.session.admin = req.user.admin;
	} else {
		req.session.admin = false;
	}
	// console.log(req.session.admin)
	// if (req.session.admin) {
	// 	req.session.userSecret = config.wt;
	// } else {
	// 	req.session.userSecret = null;
	// }
	return next();
}

function ensureAuthenticated(req, res, next) {
	// console.log('ensureAuthenticated')
	// console.log(req.isAuthenticated())
	if (req.isAuthenticated()) {
		req.session.userId = req.user._id;
		req.session.loggedin = req.user.username;
		req.session.username = req.user.username;
		req.session.admin = req.user.admin;
		return next();
	} else {
		return res.redirect('/login');
	}
}

function ensureAdmin(req, res, next) {
	const admins = config.admins.split(/\,\s{0,5}/);
	// console.log(admins.indexOf(req.user.email))
	const user = req.user;
	const isAdmin = (!user || !user.admin ? false : user.admin)
	if (isAdmin || admins.indexOf(user.email) !== -1 || admins.indexOf(user.username) !== -1) {
		req.session.userSecret = config.userSecret;
		req.session.admin = true;
		return next();
	} else {
		return res.redirect('/mtg/jitsi')
	}
}


module.exports = { ensureAdmin, ensureAuthenticated, sessionAdmin, sessionReferrer }