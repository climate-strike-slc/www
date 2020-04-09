const Joi = require('joi');
const path = require('path');
// require and configure dotenv, will load vars in .env in PROCESS.ENV
const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

// define validation for all the env vars
const envVarsSchema = Joi.object({
	PORT: Joi.number().default(9999),
	NODE_ENV: Joi.string().default('development'),
	SECRET: Joi.string(),
	DB: Joi.string(),
	redirectURL:Joi.string(),
	clientID: Joi.string(),
	clientSecret: Joi.string(),
	redirectURLTest:Joi.string(),
	clientIDTest: Joi.string(),
	clientSecretTest: Joi.string(),
	userName: Joi.string(),
	userSecret: Joi.string(),
	TEST_ENV: Joi.boolean().default(false),
	RECORD_ENV: Joi.boolean().default(false),
	JWT_KEY: Joi.string(),
	JWT_SECRET: Joi.string(),
	HOST_ID: Joi.string(),
	ADMINS: Joi.string(),
	WT: Joi.string()
})
  .unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);
if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
	port: envVars.PORT,
  env: envVars.NODE_ENV,
	testenv: envVars.TEST_ENV,
	recordenv: envVars.RECORD_ENV,
	clientID: envVars.clientID,
	clientSecret: envVars.clientSecret,
	redirectURL: envVars.redirectURL,
	clientIDTest: envVars.clientIDTest,
	clientSecretTest: envVars.clientSecretTest,
	redirectURLTest: envVars.redirectURLTest,
	jwtKey: envVars.JWT_KEY,
	jwtSecret: envVars.JWT_SECRET,
	hostID: envVars.HOST_ID,
	db: envVars.DB,
	secret: envVars.SECRET,
	admins: envVars.ADMINS,
	userName: envVars.userName,
	userSecret: envVars.userSecret,
	wt: envVars.WT
};

module.exports = config;
