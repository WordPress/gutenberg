/**
 * Internal dependencies
 */
const readConfig = require( './config' );
const { ValidationError } = require( './validate-config' );
const dbEnv = require( './db-env' );

/**
 * @typedef {import('./config').WPConfig} WPConfig
 * @typedef {import('./config').WPServiceConfig} WPServiceConfig
 * @typedef {import('./config').WPSource} WPSource
 */

module.exports = {
	ValidationError,
	readConfig,
	dbEnv,
};
